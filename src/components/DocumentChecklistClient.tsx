'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  Check,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

interface DocumentItem {
  id: string;
  labelKey: string;
  requiredAlways: boolean;
  conditionNote: string | null;
  formatNote: string | null;
}

interface VacancySummary {
  id: string;
  title: string;
  orgName: string;
  sourceUrl: string;
  lastDate: string;
}

interface DocumentChecklistClientProps {
  id: string;
  locale: Locale;
}

export function DocumentChecklistClient({ id, locale }: DocumentChecklistClientProps) {
  const t = useTranslations('screen5');
  const router = useRouter();

  const [vacancy, setVacancy] = useState<VacancySummary | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true);
        const res = await fetch(`/api/vacancies/${id}/documents`);
        if (res.ok) {
          const data = await res.json();
          setVacancy(data.vacancy);
          setDocuments(data.documents || []);

          // Load checked state from localStorage
          const storageKey = `rozgarsetu_docs_${id}`;
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            try {
              setCheckedIds(JSON.parse(stored));
            } catch {
              // fallback to default mock states: top 2 checked per Screen 5 mock
              setCheckedIds({
                'doc-na-1': true,
                'doc-na-2': true,
              });
            }
          } else {
            // Screen 5 mock-up shows first two items checked by default
            setCheckedIds({
              'doc-na-1': true,
              'doc-na-2': true,
              'doc-default-1': true,
              'doc-default-2': true,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDocuments();
  }, [id]);

  const toggleCheck = (docId: string) => {
    setCheckedIds((prev) => {
      const next = { ...prev, [docId]: !prev[docId] };
      // Save automatically to localStorage
      localStorage.setItem(`rozgarsetu_docs_${id}`, JSON.stringify(next));
      return next;
    });
    setSavedSuccess(false);
  };

  const handleSave = () => {
    localStorage.setItem(`rozgarsetu_docs_${id}`, JSON.stringify(checkedIds));
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  // Helper to translate labelKey or fallback gracefully
  const getDocumentLabel = (key: string): string => {
    try {
      return t(`documentLabels.${key}` as 'documentLabels.educational_certificates');
    } catch {
      return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center py-12 text-slate-500 text-sm">
        {t('documentChecklist')}...
      </div>
    );
  }

  const readyCount = documents.filter((d) => checkedIds[d.id]).length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] justify-between space-y-6 pb-2">
      <div className="space-y-4">
        {/* Back Navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[44px] min-w-[44px] -ml-2 px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Heading & Subtitle matching Screen 5 */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {t('subtitle')}
          </p>
          {vacancy && (
            <p className="text-xs font-semibold text-blue-700 pt-0.5">
              {vacancy.title} · {vacancy.orgName}
            </p>
          )}
        </div>

        {/* Readiness progress pill */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 bg-slate-100 rounded-lg px-3 py-2">
          <span>{readyCount} of {documents.length} ready</span>
          <span className="text-slate-500">
            {readyCount === documents.length ? 'All ready' : 'Preparation in progress'}
          </span>
        </div>

        {/* Checklist items */}
        <div className="space-y-2.5" role="group" aria-label={t('documentChecklist')}>
          {documents.map((doc) => {
            const isChecked = Boolean(checkedIds[doc.id]);
            const label = getDocumentLabel(doc.labelKey);

            return (
              <label
                key={doc.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer select-none min-h-[52px] ${
                  isChecked
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCheck(doc.id)}
                    className="sr-only"
                    aria-label={label}
                  />
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-sm font-semibold leading-snug ${
                        isChecked ? 'text-slate-900' : 'text-slate-800'
                      }`}
                    >
                      {label}
                    </span>
                    {!doc.requiredAlways && doc.conditionNote && (
                      <span className="shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Conditional
                      </span>
                    )}
                  </div>

                  {doc.conditionNote && (
                    <p className="text-[11px] text-amber-800 font-medium">
                      {doc.conditionNote}
                    </p>
                  )}

                  {doc.formatNote && (
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {doc.formatNote}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {/* Save feedback banner */}
        {savedSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{t('checklistSaved')}</span>
          </div>
        )}

        {/* Save checklist action button */}
        <div className="pt-2 space-y-2.5">
          <button
            onClick={handleSave}
            className="w-full rounded-xl bg-blue-600 py-3.5 px-4 text-white font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2 min-h-[48px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('saveChecklist')}</span>
          </button>

          <Link
            href={`/${locale}/saved`}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Bookmark className="w-4 h-4 text-blue-600" />
            <span>{t('trackSavedJobs')}</span>
          </Link>
        </div>

        {/* Footnote matching Screen 5 mock-up */}
        <div className="pt-2 text-center">
          <p className="text-xs text-slate-500 font-medium italic">
            &ldquo;{t('paperworkNotice')}&rdquo;
          </p>
        </div>
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}
