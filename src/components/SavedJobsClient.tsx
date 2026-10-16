'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Bookmark,
  Bell,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCheck2,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

interface NoticeVersion {
  id: string;
  versionNo: number;
  contentHash: string;
  snapshotJson: string;
  changeNote?: string;
  createdAt: string;
}

interface SavedJob {
  id: string;
  userId: string;
  vacancyId: string;
  progress: 'saved' | 'applied' | 'interview';
  lastSeenVersionId: string | null;
  reminderOn: string | null;
  smsConsent: boolean;
  vacancyTitle: string;
  vacancyOrgName: string;
  vacancyArea: string;
  vacancyLastDate: string;
  currentVersionId: string | null;
  hasNoticeChanged: boolean;
  previousVersion: NoticeVersion | null;
  currentVersion: NoticeVersion | null;
}

interface OutboxMessage {
  id: string;
  channel: string;
  messageKey: string;
  payloadJson: string;
  createdAt: string;
}

interface SavedJobsClientProps {
  locale: Locale;
}

export function SavedJobsClient({ locale }: SavedJobsClientProps) {
  const t = useTranslations('screen6');
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [outboxMessages, setOutboxMessages] = useState<OutboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiffJob, setSelectedDiffJob] = useState<SavedJob | null>(null);
  const [restamping, setRestamping] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/saved');
      if (res.ok) {
        const data = await res.json();
        setSavedJobs(data.savedJobs || []);
        setOutboxMessages(data.outboxMessages || []);
      }
    } catch (err) {
      console.error('Failed to load saved jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleProgressChange = async (jobId: string, newProgress: 'saved' | 'applied' | 'interview') => {
    try {
      const res = await fetch(`/api/saved/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });

      if (res.ok) {
        setSavedJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, progress: newProgress } : j))
        );
        setActionMessage(`Status updated to ${t(newProgress as 'saved')}`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleSmsConsentToggle = async (job: SavedJob) => {
    try {
      const newConsent = !job.smsConsent;
      const res = await fetch(`/api/saved/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsConsent: newConsent }),
      });

      if (res.ok) {
        setSavedJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, smsConsent: newConsent } : j))
        );
        if (newConsent) {
          setActionMessage(t('smsQueued'));
        }
        fetchSaved();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to toggle SMS consent:', err);
    }
  };

  const handleRestamp = async (job: SavedJob) => {
    try {
      setRestamping(true);
      const res = await fetch(`/api/saved/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restampVersion: true }),
      });

      if (res.ok) {
        setActionMessage(t('reStampSuccess'));
        setSelectedDiffJob(null);
        await fetchSaved();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to re-stamp version:', err);
    } finally {
      setRestamping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center py-12 text-slate-500 text-sm">
        {t('tracker')}...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] justify-between space-y-6 pb-2">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t('title')}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Track deadlines, paperwork, and notice updates
            </p>
          </div>
          <Link
            href={`/${locale}/admin/notices`}
            className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Admin Tool
          </Link>
        </div>

        {/* Action feedback toast */}
        {actionMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Empty state */}
        {savedJobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">{t('noSavedJobs')}</p>
            <Link
              href={`/${locale}/vacancies`}
              className="inline-block text-xs font-semibold text-blue-600 hover:underline"
            >
              {t('browseVacancies')}
            </Link>
          </div>
        )}

        {/* Saved job cards */}
        {savedJobs.map((job) => {
          return (
            <div
              key={job.id}
              className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-2xs"
            >
              {/* Notice Watch banner if version changed */}
              {job.hasNoticeChanged && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-amber-900 leading-snug">
                      {t('noticeChanged')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDiffJob(job)}
                    className="w-full text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 py-1.5 px-3 rounded-md transition-colors text-center min-h-[36px]"
                  >
                    {t('reviewChange')}
                  </button>
                </div>
              )}

              {/* Title & Metadata */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {job.vacancyTitle} · {job.vacancyId === 'notice-a' ? 'Notice A' : job.vacancyOrgName}
                  </h2>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {t('deadline')}: {job.vacancyLastDate}
                </p>
              </div>

              {/* User Progress (Mandatory AGENTS.md rule 5) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {t('yourProgress')}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    User controlled
                  </span>
                </div>

                {/* Segmented Progress Selector */}
                <div
                  className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl"
                  role="radiogroup"
                  aria-label={t('yourProgress')}
                >
                  {(['saved', 'applied', 'interview'] as const).map((step) => {
                    const isActive = job.progress === step;
                    return (
                      <button
                        key={step}
                        onClick={() => handleProgressChange(job.id, step)}
                        className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all min-h-[40px] ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                        role="radio"
                        aria-checked={isActive}
                      >
                        {t(step as 'saved')}
                      </button>
                    );
                  })}
                </div>

                {/* Non-negotiable AGENTS.md rule 5 notice */}
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic pt-0.5">
                  &ldquo;{t('progressDisclaimer')}&rdquo;
                </p>
              </div>

              {/* Reminder Section & Outbox */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t('reminderLabel')}</span>
                  </span>
                </div>

                {/* SMS Consent Checkbox */}
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={job.smsConsent}
                    onChange={() => handleSmsConsentToggle(job)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="font-medium">{t('smsConsent')}</span>
                  {job.smsConsent && (
                    <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      SMS active
                    </span>
                  )}
                </label>
              </div>

              {/* Navigation shortcuts to Document Checklist and Eligibility Check */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Link
                  href={`/${locale}/vacancies/${job.vacancyId}/documents`}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 px-3 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Documents</span>
                </Link>

                <Link
                  href={`/${locale}/vacancies/${job.vacancyId}/check`}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 px-3 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Check Result</span>
                </Link>
              </div>
            </div>
          );
        })}

        {/* Demo Outbox Stub Inspection Panel */}
        {outboxMessages.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Outbox queue (SMS / In-App demo stubs)</span>
            </div>
            <div className="space-y-1.5">
              {outboxMessages.slice(0, 3).map((msg) => (
                <div
                  key={msg.id}
                  className="text-[11px] bg-white border border-slate-200 rounded-lg p-2 font-mono text-slate-600 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-blue-700 uppercase">[{msg.channel}]</span>{' '}
                    <span>{msg.messageKey}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Queued
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Corrigendum Diff Modal */}
      {selectedDiffJob && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-amber-500 text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold">{t('corrigendumTitle')}</h3>
              </div>
              <button
                onClick={() => setSelectedDiffJob(null)}
                className="text-white/80 hover:text-white p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedDiffJob.vacancyTitle}
                </h4>
                <p className="text-xs text-slate-500">
                  A new corrigendum has been published for this notice.
                </p>
              </div>

              {/* Before and After comparison cards */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    {t('previousVersion')} (Version 1)
                  </div>
                  <div className="text-slate-800 font-medium">
                    Deadline: 12 Nov 2026
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Status: Original advertisement
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-amber-300 bg-amber-50 space-y-1">
                  <div className="font-bold text-amber-800 uppercase text-[10px] tracking-wider">
                    {t('updatedVersion')} (Version 2)
                  </div>
                  <div className="text-amber-950 font-bold">
                    Deadline: {selectedDiffJob.vacancyLastDate}
                  </div>
                  <div className="text-amber-900 text-[11px] leading-snug">
                    {selectedDiffJob.currentVersion?.changeNote ||
                      'Corrigendum 1: Deadline extended to 20 Nov 2026. Clause 4(b) equivalent qualifications clarified.'}
                  </div>
                </div>
              </div>

              {/* Action button to re-stamp */}
              <div className="pt-1 space-y-2">
                <button
                  onClick={() => handleRestamp(selectedDiffJob)}
                  disabled={restamping}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 px-4 shadow-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <RefreshCw className={`w-4 h-4 ${restamping ? 'animate-spin' : ''}`} />
                  <span>{t('reStampNotice')}</span>
                </button>

                <button
                  onClick={() => setSelectedDiffJob(null)}
                  className="w-full rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs py-2.5 min-h-[40px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav locale={locale} />
    </div>
  );
}
