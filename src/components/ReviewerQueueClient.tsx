'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UserCheck,
  RotateCcw,
  History,
  Lock,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

interface Decision {
  id: string;
  reportId: string;
  action: string;
  reason: string;
  proposedBy: string;
  approvedBy: string | null;
  appliedAt: string | null;
}

interface ReportItem {
  id: string;
  ref: string;
  vacancyId: string;
  reasons: string[];
  note: string | null;
  status: 'received' | 'under_review' | 'closed';
  createdAt: string;
  ackDueAt: string;
  triageDueAt: string;
  vacancyTitle: string;
  vacancyOrgName: string;
  vacancyArea: string;
  vacancyStatus: string;
  isHighRisk: boolean;
  latestDecision: Decision | null;
}

interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  reason: string;
  createdAt: string;
}

interface ReviewerQueueClientProps {
  locale: Locale;
}

const isSameReviewer = (a?: string | null, b?: string | null) => {
  if (!a || !b) return false;
  const normA = a === 'reviewer-1' ? 'rev-1' : a === 'reviewer-2' ? 'rev-2' : a;
  const normB = b === 'reviewer-1' ? 'rev-1' : b === 'reviewer-2' ? 'rev-2' : b;
  return normA === normB;
};

export function ReviewerQueueClient({ locale }: ReviewerQueueClientProps) {
  const t = useTranslations('screen9');
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [audits, setAudits] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewer, setActiveReviewer] = useState<'reviewer-1' | 'reviewer-2' | 'admin'>('reviewer-1');
  const [actionInputs, setActionInputs] = useState<
    Record<string, { action: string; reason: string }>
  >({});
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resReports, resCorrigendum] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/admin/corrigendum'),
      ]);

      if (resReports.ok) {
        const data = await resReports.json();
        setReportsList(data.reports || []);
        if (data.audits) {
          setAudits(data.audits);
        }
      }

      if (resCorrigendum.ok) {
        const data = await resCorrigendum.json();
        if (data.audits && data.audits.length > 0) {
          setAudits((prev) => (prev.length === 0 ? data.audits : prev));
        }
      }
    } catch (err) {
      console.error('Failed to load reviewer queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActionSelect = (reportId: string, action: string) => {
    setActionInputs((prev) => ({
      ...prev,
      [reportId]: {
        action,
        reason: prev[reportId]?.reason || (action === 'suspend' ? 'Listing asks for an illegal registration fee via personal messaging.' : ''),
      },
    }));
    setFeedback(null);
  };

  const handleReasonChange = (reportId: string, reason: string) => {
    setActionInputs((prev) => ({
      ...prev,
      [reportId]: {
        action: prev[reportId]?.action || 'suspend',
        reason,
      },
    }));
  };

  const handlePropose = async (reportId: string) => {
    const input = actionInputs[reportId];
    if (!input?.action || !input?.reason.trim()) {
      setFeedback({ message: 'Action and mandatory reason are required.', type: 'error' });
      return;
    }

    try {
      const res = await fetch(`/api/reports/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'propose',
          action: input.action,
          reason: input.reason,
          reviewerId: activeReviewer,
        }),
      });

      if (res.ok) {
        setFeedback({
          message: 'Decision proposed. A second reviewer must approve this high-risk case.',
          type: 'success',
        });
        await fetchData();
      } else {
        const err = await res.json();
        setFeedback({ message: err.error || 'Failed to propose action', type: 'error' });
      }
    } catch (err) {
      console.error('Error proposing action:', err);
    }
  };

  const handleApprove = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'approve',
          reviewerId: activeReviewer,
        }),
      });

      if (res.ok) {
        setFeedback({
          message: 'Approved by second reviewer. Listing has been suspended.',
          type: 'success',
        });
        await fetchData();
      } else {
        const err = await res.json();
        setFeedback({ message: err.error || 'Failed to approve', type: 'error' });
      }
    } catch (err) {
      console.error('Error approving decision:', err);
    }
  };

  const handleResetQueue = async () => {
    try {
      const res = await fetch('/api/reports/reset', { method: 'POST' });
      if (res.ok) {
        setFeedback({ message: 'Reviewer queue reset to seed state.', type: 'success' });
        await fetchData();
      }
    } catch (err) {
      console.error('Error resetting queue:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-between space-y-6 pb-2">
        <div className="flex flex-col justify-center items-center py-12 text-slate-500 text-sm">
          Loading reviewer queue...
        </div>
        <BottomNav locale={locale} />
      </div>
    );
  }

  // Format reason tags
  const formatReasons = (keys: string[]) => {
    const map: Record<string, string> = {
      asks_fee: 'asks for a fee',
      personal_number_only: 'personal number only',
      no_business_details: 'no business details',
      unrealistic_pay: 'pay looks unrealistic',
      other: 'other reason',
    };
    return keys.map((k) => map[k] || k).join('; ');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] justify-between space-y-6 pb-2">
      <div className="space-y-4">
        {/* Header matching Screen 9 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t('title')}
            </h1>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/${locale}/admin/notices/new`}
                className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors"
              >
                + Ingest Notice
              </Link>
              <Link
                href={`/${locale}/admin/notices`}
                className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors"
              >
                Corrigendum →
              </Link>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = `/${locale}`;
                }}
                className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
              >
                Exit Portal
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {t('subtitle')}
          </p>
        </div>

        {/* Persona Switcher for interactive evaluator demo */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('switchReviewer')} (demo control):</span>
            </span>
            <button
              onClick={handleResetQueue}
              className="text-[10px] text-slate-500 hover:text-slate-800 underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset queue</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={t('switchReviewer')}>
            <button
              onClick={() => setActiveReviewer('reviewer-1')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center min-h-[40px] ${
                activeReviewer === 'reviewer-1'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Reviewer 1 (Proposer)
            </button>

            <button
              onClick={() => setActiveReviewer('reviewer-2')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center min-h-[40px] ${
                activeReviewer === 'reviewer-2'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Reviewer 2 (Approver)
            </button>
          </div>
        </div>

        {/* Feedback alert toast */}
        {feedback && (
          <div
            className={`flex items-start gap-2 p-3 rounded-xl text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                : 'bg-rose-100 border border-rose-300 text-rose-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Empty state */}
        {reportsList.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            {t('noPendingReports')}
          </div>
        )}

        {/* Reports Queue Cards matching Screen 9 */}
        {reportsList.map((rep) => {
          const currentInput = actionInputs[rep.id] || {
            action: 'suspend',
            reason: 'Listing asks for an illegal registration fee via personal messaging.',
          };
          const decision = rep.latestDecision;
          const isPendingSecondApproval =
            rep.status === 'under_review' && decision && !decision.approvedBy;
          const isClosed = rep.status === 'closed';

          return (
            <div
              key={rep.id}
              className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs"
            >
              {/* Header: Reference and Title */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {rep.ref} · {rep.vacancyTitle}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium pt-0.5">
                    {t('reasons')}: {formatReasons(rep.reasons)}
                  </p>
                </div>
                {rep.isHighRisk && (
                  <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md">
                    {t('highRisk')}
                  </span>
                )}
              </div>

              {/* Status Notice matching Screen 9 */}
              <div
                className={`p-3 rounded-xl border text-xs font-semibold space-y-1 ${
                  isClosed
                    ? 'bg-slate-100 border-slate-200 text-slate-800'
                    : isPendingSecondApproval
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isClosed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  <span>
                    {isClosed
                      ? `Status: Closed. Listing is ${rep.vacancyStatus}.`
                      : isPendingSecondApproval
                      ? t('statusUnderReview')
                      : 'Status: Received. Triage action pending.'}
                  </span>
                </div>

                {isPendingSecondApproval && decision && (
                  <div className="text-[11px] font-normal text-amber-950 pl-5.5 space-y-0.5">
                    <p>
                      <strong className="font-semibold">Proposed action:</strong>{' '}
                      {decision.action === 'suspend' ? t('suspendListing') : decision.action} by{' '}
                      <span className="font-mono">{decision.proposedBy}</span>
                    </p>
                    <p>
                      <strong className="font-semibold">Reason:</strong> {decision.reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Reviewer Action Controls */}
              {!isClosed && !isPendingSecondApproval && (
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700">
                      {t('proposedAction')}
                    </span>

                    {/* Action buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { key: 'suspend', label: t('suspendListing') },
                        { key: 'ask_correction', label: t('askCorrection') },
                        { key: 'close', label: t('closeReport') },
                      ].map((act) => (
                        <button
                          key={act.key}
                          type="button"
                          onClick={() => handleActionSelect(rep.id, act.key)}
                          className={`py-2 px-1 text-[11px] font-semibold rounded-lg border text-center transition-colors min-h-[44px] ${
                            currentInput.action === act.key
                              ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mandatory Reason Input */}
                  <div className="space-y-1">
                    <label
                      htmlFor={`reason-${rep.id}`}
                      className="text-xs font-semibold text-slate-600"
                    >
                      {t('reason')} (mandatory for audit trail)
                    </label>
                    <input
                      id={`reason-${rep.id}`}
                      type="text"
                      value={currentInput.reason}
                      onChange={(e) => handleReasonChange(rep.id, e.target.value)}
                      placeholder={t('reasonPlaceholder')}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                    />
                  </div>

                  {/* Propose Action Button */}
                  <button
                    onClick={() => handlePropose(rep.id)}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs py-3 px-4 shadow-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>{t('proposeAction')} (as {activeReviewer})</span>
                  </button>
                </div>
              )}

              {/* Second Reviewer Approval Controls */}
              {isPendingSecondApproval && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  {isSameReviewer(activeReviewer, decision?.proposedBy) ? (
                    /* Self-approval is BLOCKED per non-negotiable two-reviewer rule */
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Lock className="w-4 h-4 text-amber-700" />
                        <span>Two-reviewer rule active</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        You proposed this action as <span className="font-mono">{decision?.proposedBy}</span>. A different reviewer must approve it. Switch persona to <strong>Reviewer 2</strong> above to approve.
                      </p>
                    </div>
                  ) : (
                    /* Second Reviewer can approve */
                    <button
                      onClick={() => handleApprove(rep.id)}
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs py-3 px-4 shadow-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{t('approve')} (as {activeReviewer})</span>
                    </button>
                  )}
                </div>
              )}

              {/* Executed confirmation */}
              {isClosed && (
                <div className="pt-1 text-xs text-slate-500 space-y-0.5">
                  <p>
                    <span className="font-semibold text-slate-700">Executed action:</span>{' '}
                    <span className="font-mono text-rose-700 font-bold uppercase">
                      {decision?.action || 'suspend'}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Audit record:</span>{' '}
                    Proposed by {decision?.proposedBy || 'reviewer-1'}, approved by{' '}
                    {decision?.approvedBy || 'reviewer-2'}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Audit Disclaimer matching Screen 9 */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500 font-medium italic">
            &ldquo;{t('auditDisclaimer')}&rdquo;
          </p>
        </div>

        {/* Live Audit Trail */}
        {audits.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('auditTrail')} (live audit_log table)</span>
            </div>

            <div className="space-y-1.5">
              {audits.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg bg-white border border-slate-200 p-2 text-[11px] space-y-0.5"
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
