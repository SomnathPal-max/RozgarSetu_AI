'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FilePlus,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  UserCheck,
  Lock,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

interface NoticeItem {
  id: string;
  title: string;
  orgName: string;
  area: string;
  status: string;
  sourceUrl: string;
  publishedOn: string;
  lastDate: string;
  noticeNumber?: string | null;
  firstReviewerId?: string | null;
  secondReviewerId?: string | null;
}

interface NoticeAuthoringClientProps {
  locale: Locale;
}

export function NoticeAuthoringClient({ locale }: NoticeAuthoringClientProps) {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activePersona, setActivePersona] = useState<'reviewer' | 'reviewer2'>('reviewer');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [orgName, setOrgName] = useState('');
  const [noticeNumber, setNoticeNumber] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [gazettePdfUrl, setGazettePdfUrl] = useState('');
  const [applicationPortalUrl, setApplicationPortalUrl] = useState('');
  const [publishedOn, setPublishedOn] = useState(new Date().toISOString().split('T')[0]);
  const [lastDate, setLastDate] = useState('2026-12-15');
  const [cutoffDate, setCutoffDate] = useState('2026-08-01');
  const [totalVacancies, setTotalVacancies] = useState('150');
  const [feeGeneral, setFeeGeneral] = useState('100');
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('30');
  const [requiredQualification, setRequiredQualification] = useState('graduate');
  const [requiredStream, setRequiredStream] = useState('');
  const [scRelaxation, setScRelaxation] = useState('5');
  const [obcRelaxation, setObcRelaxation] = useState('3');

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/notices');
      if (res.ok) {
        const data = await res.json();
        setNotices(data.notices || []);
      }
    } catch (err) {
      console.error('Failed to fetch notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          orgName,
          noticeNumber,
          sourceUrl,
          gazettePdfUrl,
          applicationPortalUrl,
          publishedOn,
          lastDate,
          cutoffDate,
          totalVacancies,
          feeGeneral,
          minAge,
          maxAge,
          requiredQualification,
          requiredStream,
          scRelaxation,
          obcRelaxation,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback({
          type: 'success',
          message: data.message || 'Notice ingested. Now under review pending Two-Reviewer approval.',
        });
        // Reset form
        setTitle('');
        setOrgName('');
        setNoticeNumber('');
        setSourceUrl('');
        setGazettePdfUrl('');
        await fetchNotices();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to ingest notice.',
        });
      }
    } catch (err) {
      console.error('Failed to create notice:', err);
      setFeedback({ type: 'error', message: 'Network error submitting notice' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewStep = async (noticeId: string, step: 'step1_source_validation' | 'step2_rules_audit') => {
    try {
      setFeedback(null);
      const res = await fetch(`/api/admin/notices/${noticeId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          reviewerPersona: activePersona,
          reason: `Review executed by persona ${activePersona}`,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback({
          type: 'success',
          message: data.message,
        });
        await fetchNotices();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Review sign-off rejected by server policy.',
        });
      }
    } catch (err) {
      console.error('Error conducting review:', err);
      setFeedback({ type: 'error', message: 'Failed to communicate review decision' });
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] justify-between space-y-6 pb-2">
      <div className="space-y-5">
        {/* Navigation header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Admin Queue</span>
          </Link>
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded text-[11px] font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Two-Reviewer Studio</span>
          </div>
        </div>

        {/* Persona Switcher for Evaluators */}
        <div className="p-3 bg-slate-100 rounded-xl space-y-2 border border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Current Reviewer Persona:</span>
            </span>
            <span className="font-bold text-blue-700 uppercase">{activePersona}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActivePersona('reviewer')}
              className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors ${
                activePersona === 'reviewer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Demo Reviewer 1 (Source Verifier)
            </button>
            <button
              type="button"
              onClick={() => setActivePersona('reviewer2')}
              className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors ${
                activePersona === 'reviewer2'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Demo Reviewer 2 (Rules Auditor)
            </button>
          </div>
        </div>

        {/* Feedback alert toast */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : feedback.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-blue-50 border-blue-300 text-blue-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Existing Notices & Two-Reviewer Approval Pipeline */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Recruitment Notices & Verification Pipeline</span>
          </h2>

          <div className="space-y-2">
            {loading && notices.length === 0 && (
              <p className="text-xs text-slate-500 italic p-3">Loading notices...</p>
            )}
            {notices.map((n) => {
              const isUnderReview = n.status === 'under_review';
              const step1Done = Boolean(n.firstReviewerId);
              const step2Done = Boolean(n.secondReviewerId);

              return (
                <div
                  key={n.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">
                        {n.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {n.orgName} · {n.area}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                        n.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : n.status === 'under_review'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {n.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <span>Deadline: {n.lastDate}</span>
                    <a
                      href={n.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>Official Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Two-Reviewer Action Panel for under_review notices */}
                  {isUnderReview && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-amber-900 text-[11px]">
                        <span>Two-Reviewer Rule Status:</span>
                        <span>
                          {step1Done && step2Done
                            ? 'Approved'
                            : step1Done
                            ? 'Step 1 Done (Needs 2nd Reviewer)'
                            : 'Pending Step 1'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleReviewStep(n.id, 'step1_source_validation')}
                          disabled={step1Done}
                          className={`py-1.5 px-2 rounded-md font-semibold text-[11px] transition-colors ${
                            step1Done
                              ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {step1Done ? `✓ Step 1: ${n.firstReviewerId}` : 'Step 1: Verify Domain'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReviewStep(n.id, 'step2_rules_audit')}
                          disabled={!step1Done || step2Done}
                          className={`py-1.5 px-2 rounded-md font-semibold text-[11px] transition-colors ${
                            step2Done
                              ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed'
                              : !step1Done
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {step2Done ? `✓ Step 2: ${n.secondReviewerId}` : 'Step 2: Audit & Publish'}
                        </button>
                      </div>

                      <p className="text-[10px] text-amber-800 italic">
                        * Note: If Reviewer 1 attempts to sign off Step 2, the server strictly rejects the self-approval.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notice Ingestion Studio Form */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FilePlus className="w-4 h-4 text-blue-600" />
              <span>Ingest New Recruitment Circular / Gazette</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ingests official notices into the deterministic rules engine. Requires two distinct reviewer approvals to go live.
            </p>
          </div>

          <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
            {/* Title & Organization */}
            <div className="space-y-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Post Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assistant Executive Officer (Group B)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Recruiting Body / Department *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Public Service Commission"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Gazette / Notice Reference No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PSC/WB/2026/04-A"
                    value={noticeNumber}
                    onChange={(e) => setNoticeNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                  />
                </div>
              </div>
            </div>

            {/* Official URLs */}
            <div className="space-y-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Official Gazette Source URL (Must be HTTPS) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example-recruiting.internal.gov/notices/2026/notice-x"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Gazette PDF Circular URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example-recruiting.internal.gov/docs/circular.pdf"
                    value={gazettePdfUrl}
                    onChange={(e) => setGazettePdfUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Application Portal URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://apply.internal.gov"
                    value={applicationPortalUrl}
                    onChange={(e) => setApplicationPortalUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Total Vacancies Count
                  </label>
                  <input
                    type="number"
                    value={totalVacancies}
                    onChange={(e) => setTotalVacancies(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                  />
                </div>
              </div>
            </div>

            {/* Dates & Fee */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Publication Date *
                </label>
                <input
                  type="date"
                  required
                  value={publishedOn}
                  onChange={(e) => setPublishedOn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Application Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={lastDate}
                  onChange={(e) => setLastDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Age Cutoff Reference Date
                </label>
                <input
                  type="date"
                  value={cutoffDate}
                  onChange={(e) => setCutoffDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  General Fee (₹)
                </label>
                <input
                  type="number"
                  value={feeGeneral}
                  onChange={(e) => setFeeGeneral(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                />
              </div>
            </div>

            {/* Statutory Eligibility Rule Configuration */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">
                Statutory Criteria Rules (Deterministic Engine)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Min Age
                  </label>
                  <input
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Max Age (Gen)
                  </label>
                  <input
                    type="number"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    SC/ST Relax. (Yrs)
                  </label>
                  <input
                    type="number"
                    value={scRelaxation}
                    onChange={(e) => setScRelaxation(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    OBC Relax. (Yrs)
                  </label>
                  <input
                    type="number"
                    value={obcRelaxation}
                    onChange={(e) => setObcRelaxation(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Required Qualification Level
                  </label>
                  <select
                    value={requiredQualification}
                    onChange={(e) => setRequiredQualification(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white text-slate-900 min-h-[36px]"
                  >
                    <option value="secondary">Secondary (10th Pass)</option>
                    <option value="higher_secondary">Higher Secondary (12th Pass)</option>
                    <option value="diploma_iti">Diploma / ITI</option>
                    <option value="graduate">Graduate (Bachelor&apos;s Degree)</option>
                    <option value="postgraduate">Postgraduate (Master&apos;s Degree)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Required Stream (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Science / Commerce / Any"
                    value={requiredStream}
                    onChange={(e) => setRequiredStream(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white text-slate-900 min-h-[36px]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 px-4 shadow-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <FilePlus className="w-4 h-4" />
              <span>{submitting ? 'Ingesting...' : 'Ingest Notice for Review'}</span>
            </button>
          </form>
        </div>
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}
