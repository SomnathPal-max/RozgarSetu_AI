'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  History,
  FileEdit,
  ExternalLink,
  Bookmark,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

interface NoticeVersion {
  id: string;
  versionNo: number;
  contentHash: string;
  changeNote?: string;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  reason: string;
  createdAt: string;
}

interface VacancyData {
  id: string;
  title: string;
  orgName: string;
  lastDate: string;
  currentNoticeVersionId: string;
}

interface AdminCorrigendumClientProps {
  locale: Locale;
}

export function AdminCorrigendumClient({ locale }: AdminCorrigendumClientProps) {
  const t = useTranslations('adminNotices');
  const [vacancy, setVacancy] = useState<VacancyData | null>(null);
  const [versions, setVersions] = useState<NoticeVersion[]>([]);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/corrigendum');
      if (res.ok) {
        const data = await res.json();
        setVacancy(data.vacancy);
        setVersions(data.versions || []);
        setAudits(data.audits || []);
      }
    } catch (err) {
      console.error('Failed to load corrigendum data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulate = async () => {
    try {
      setOperating(true);
      const res = await fetch('/api/admin/corrigendum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancyId: 'notice-a' }),
      });

      if (res.ok) {
        setFeedback({
          type: 'success',
          message: t('successNotice'),
        });
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to simulate corrigendum:', err);
    } finally {
      setOperating(false);
    }
  };

  const handleReset = async () => {
    try {
      setOperating(true);
      const res = await fetch('/api/admin/corrigendum', {
        method: 'DELETE',
      });

      if (res.ok) {
        setFeedback({
          type: 'info',
          message: t('resetNotice'),
        });
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to reset notice:', err);
    } finally {
      setOperating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center py-12 text-slate-500 text-sm">
        Loading...
      </div>
    );
  }

  const isCorrigendumActive = vacancy?.currentNoticeVersionId?.includes('-2');

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] justify-between space-y-6 pb-2">
      <div className="space-y-4">
        {/* Back navigation */}
        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[44px] min-w-[44px] -ml-2 px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Admin Home</span>
        </Link>

        {/* Heading & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t('title')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Status Banner */}
        {feedback && (
          <div
            className={`flex items-start gap-2 p-3.5 rounded-xl text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                : 'bg-blue-50 border border-blue-300 text-blue-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <div className="space-y-1">
              <span>{feedback.message}</span>
              {feedback.type === 'success' && (
                <div>
                  <Link
                    href={`/${locale}/saved`}
                    className="underline font-bold text-blue-700 hover:text-blue-900 inline-block pt-1"
                  >
                    Open Saved Jobs to view Notice Watch alert →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notice Info Card */}
        {vacancy && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Target Notice
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {vacancy.title} · {vacancy.orgName}
                </h2>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isCorrigendumActive
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isCorrigendumActive ? 'Corrigendum Active' : 'Original Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
              <div>
                <span className="text-slate-500 font-medium">{t('currentVersion')}:</span>{' '}
                <span className="font-bold text-slate-800">
                  {vacancy.currentNoticeVersionId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Deadline:</span>{' '}
                <span className="font-bold text-slate-800">{vacancy.lastDate}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleSimulate}
                disabled={operating || isCorrigendumActive}
                className={`w-full rounded-xl py-3 px-4 font-semibold text-xs flex items-center justify-center gap-2 min-h-[44px] transition-colors shadow-xs ${
                  isCorrigendumActive
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white'
                }`}
              >
                <FileEdit className="w-4 h-4" />
                <span>
                  {operating
                    ? t('simulating')
                    : isCorrigendumActive
                    ? 'Corrigendum Already Published'
                    : t('simulateButton')}
                </span>
              </button>

              <button
                onClick={handleReset}
                disabled={operating || !isCorrigendumActive}
                className={`w-full rounded-xl border py-2.5 px-4 font-semibold text-xs flex items-center justify-center gap-2 min-h-[40px] transition-colors ${
                  !isCorrigendumActive
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('resetButton')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Demo Navigation */}
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/saved`}
            className="flex-1 rounded-xl bg-blue-50 border border-blue-200 py-2.5 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
          >
            <Bookmark className="w-4 h-4" />
            <span>Screen 6: Saved Jobs</span>
          </Link>
          <Link
            href={`/${locale}/vacancies/notice-a`}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Screen 3: Notice A</span>
          </Link>
        </div>

        {/* Version & History Section */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('changeHistory')}</span>
          </div>

          <div className="space-y-2">
            {versions.map((ver) => (
              <div
                key={ver.id}
                className="rounded-lg border border-slate-200 bg-white p-3 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Version {ver.versionNo} ({ver.id})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ver.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {ver.changeNote && (
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {ver.changeNote}
                  </p>
                )}
                <p className="text-[10px] font-mono text-slate-400 truncate">
                  Hash: {ver.contentHash}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Trail (Mandatory AGENTS.md rule) */}
        {audits.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{t('auditLogged')} (audit_log table)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {audits.length} entries
              </span>
            </div>

            <div className="space-y-1.5">
              {audits.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-[11px] space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {a.actor} · <span className="font-mono text-blue-700">{a.action}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[10px]">{a.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}
