'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Check,
  Send,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

interface VacancySummary {
  id: string;
  title: string;
  orgName: string;
  area: string;
}

interface ReportListingClientProps {
  vacancyId: string;
  locale: Locale;
}

export function ReportListingClient({ vacancyId, locale }: ReportListingClientProps) {
  const t = useTranslations('screen7');
  const router = useRouter();

  const [vacancy, setVacancy] = useState<VacancySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reasons checked state
  const [reasons, setReasons] = useState<{
    asks_fee: boolean;
    personal_number_only: boolean;
    no_business_details: boolean;
    unrealistic_pay: boolean;
    other: boolean;
  }>({
    asks_fee: vacancyId === 'msme-delivery',
    personal_number_only: vacancyId === 'msme-delivery',
    no_business_details: false,
    unrealistic_pay: false,
    other: false,
  });

  // Submission confirmation state
  const [submittedReport, setSubmittedReport] = useState<{
    ref: string;
    status: string;
    ackDueAt: string;
  } | null>(null);

  useEffect(() => {
    async function fetchVacancy() {
      try {
        setLoading(true);
        const res = await fetch(`/api/vacancies/${vacancyId}`);
        if (res.ok) {
          const data = await res.json();
          setVacancy({
            id: data.vacancy.id,
            title: data.vacancy.title,
            orgName: data.vacancy.orgName,
            area: data.vacancy.area,
          });
        }
      } catch (err) {
        console.error('Failed to load vacancy:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVacancy();
  }, [vacancyId]);

  const toggleReason = (key: keyof typeof reasons) => {
    setReasons((prev) => ({ ...prev, [key]: !prev[key] }));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedReasons = Object.entries(reasons)
      .filter(([, val]) => val)
      .map(([k]) => k);

    if (selectedReasons.length === 0) {
      setErrorMsg(t('errorSelectReason'));
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancyId,
          reasons: selectedReasons,
          note,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmittedReport(data.report);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setErrorMsg('Network error while submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center py-12 text-slate-500 text-sm">
        Loading...
      </div>
    );
  }

  const reasonItems: { key: keyof typeof reasons; label: string }[] = [
    { key: 'asks_fee', label: t('asksFee') },
    { key: 'personal_number_only', label: t('personalNumber') },
    { key: 'no_business_details', label: t('noBusinessDetails') },
    { key: 'unrealistic_pay', label: t('unrealisticPay') },
    { key: 'other', label: t('other') },
  ];

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

        {/* Heading & Target listing */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t('title')}
            </h1>
          </div>
          {vacancy && (
            <p className="text-xs font-semibold text-slate-700">
              {vacancy.title} · {vacancy.orgName}
            </p>
          )}
          <p className="text-xs text-slate-500 font-medium">
            {t('subtitle')}
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form or Confirmation view */}
        {!submittedReport ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800">
                {t('selectReasons')}
              </span>

              {/* Reasons Checkboxes */}
              <div className="space-y-2" role="group" aria-label={t('selectReasons')}>
                {reasonItems.map((item) => {
                  const isChecked = reasons[item.key];
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer select-none min-h-[48px] ${
                        isChecked
                          ? 'border-rose-300 bg-rose-50/70'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleReason(item.key)}
                        className="sr-only"
                        aria-label={item.label}
                      />
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isChecked ? 'text-rose-950' : 'text-slate-700'
                        }`}
                      >
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Optional notes textarea */}
            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-xs font-bold text-slate-700">
                {t('additionalNotes')}
              </label>
              <textarea
                id="notes"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('notesPlaceholder')}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-sm py-3.5 px-4 shadow-sm transition-colors flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? t('submitting') : t('submitReport')}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation Screen matching Screen 7 mock-up */
          <div className="space-y-4 pt-1">
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{t('reportSubmitted')}</span>
              </div>

              {/* Reference Number */}
              <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-0.5">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  {t('referenceNumber')}
                </div>
                <div className="text-lg font-black text-slate-900 tracking-tight font-mono">
                  {submittedReport.ref}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    {t('illustrativeTag')}
                  </span>
                </div>
              </div>

              {/* Status and SLA */}
              <div className="flex items-start gap-2 text-xs text-emerald-900 font-medium">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{t('statusReceived')}</span>
              </div>
            </div>

            {/* Footer note matching Screen 7 */}
            <div className="text-center pt-1">
              <p className="text-xs text-slate-500 font-medium italic">
                {t('routeToResolution')}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2.5">
              <Link
                href={`/${locale}/admin`}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 px-4 shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Shield className="w-4 h-4" />
                <span>View in Reviewer Queue (Screen 9)</span>
              </Link>

              <Link
                href={`/${locale}/vacancies/${vacancyId}`}
                className="w-full rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <span>{t('backToVacancy')}</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}
