'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
  QrCode,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

interface CriterionEvaluation {
  criterion: string;
  status: 'matched' | 'not_met' | 'missing_data' | 'manual_review';
  reasonKey?: string;
}

interface ReceiptDetails {
  receiptHash: string;
  vacancyTitle: string;
  candidateAgeOnCutoff: string;
  candidateQualification: string;
  candidateCategory: string;
  evaluationResult: CriterionEvaluation[];
  rulesVersion: string;
  generatedAt: string;
  isHelperMode: boolean;
}

interface VerificationPageProps {
  hash: string;
  locale: Locale;
}

export function VerificationReceiptPageClient({ hash, locale }: VerificationPageProps) {
  const [data, setData] = useState<{
    receipt: ReceiptDetails;
    officialNoticeUrl: string;
    isPreliminary: boolean;
    verified: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        setLoading(true);
        const res = await fetch(`/api/verify/${hash}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError('Receipt hash could not be verified in the public registry.');
        }
      } catch (err) {
        console.error('Failed to verify receipt hash:', err);
        setError('Network error connecting to verification hub.');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [hash]);

  const getStatusBadge = (status: CriterionEvaluation['status']) => {
    switch (status) {
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Matched</span>
          </span>
        );
      case 'not_met':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Not met</span>
          </span>
        );
      case 'missing_data':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Missing data</span>
          </span>
        );
      case 'manual_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Manual review</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center py-12 text-slate-500 text-sm">
        Verifying cryptographic receipt stamp...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 space-y-4">
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <h2 className="text-sm font-bold">Verification Failed</h2>
          </div>
          <p className="text-xs">{error || 'Invalid receipt reference.'}</p>
        </div>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to RozgarSetu AI Home</span>
        </Link>
      </div>
    );
  }

  const { receipt } = data;

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] justify-between space-y-6 pb-2">
      <div className="space-y-4">
        {/* Verification Hub Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Cryptographically Verified</span>
          </div>
        </div>

        {/* Verification Certificate Card */}
        <div className="p-5 rounded-2xl border-2 border-emerald-500/30 bg-white shadow-md space-y-4">
          <div className="border-b border-slate-100 pb-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Official Eligibility Audit Proof
            </span>
            <h1 className="text-lg font-bold text-slate-900 leading-snug">
              {receipt.vacancyTitle}
            </h1>
            <p className="text-xs text-slate-500 font-mono break-all pt-0.5">
              Hash: {receipt.receiptHash}
            </p>
          </div>

          {/* Evaluated Profile (Redacted / Privacy Protected) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
              Profile Evaluated at Timestamp
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">Age on Cutoff</span>
                <span className="font-semibold">{receipt.candidateAgeOnCutoff}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Qualification</span>
                <span className="font-semibold capitalize">
                  {receipt.candidateQualification.replace('_', ' ')}
                </span>
              </div>
            </div>
            {receipt.candidateCategory && (
              <div className="pt-1 border-t border-slate-200/60">
                <span className="text-slate-500 text-[10px] block">Category Claimed</span>
                <span className="font-semibold text-slate-800">{receipt.candidateCategory}</span>
              </div>
            )}
          </div>

          {/* Deterministic Evaluation Output */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 text-xs block">
              Deterministic Per-Criterion Results:
            </span>
            <div className="space-y-1.5">
              {receipt.evaluationResult.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/60 text-xs"
                >
                  <span className="font-medium text-slate-700 capitalize">
                    {item.criterion.replace('_', ' ')}
                  </span>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Preliminary Watermark per AGENTS.md rule 4 */}
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-center space-y-1">
            <p className="text-[11px] font-bold text-amber-950 uppercase tracking-wide">
              PRELIMINARY: Verify against the official notice before you act
            </p>
            <p className="text-[10px] text-amber-900 leading-relaxed">
              Rules decide eligibility. A language model never decides eligibility. This record confirms the exact output of the deterministic rules engine on snapshot {receipt.rulesVersion}.
            </p>
          </div>

          {/* Metadata Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="space-y-0.5">
              <span className="block font-semibold text-slate-700">
                Generated: {new Date(receipt.generatedAt).toLocaleString('en-IN')}
              </span>
              <a
                href={data.officialNoticeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Full Official Notice Circular</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="w-12 h-12 border border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 p-1">
              <QrCode className="w-10 h-10 text-slate-800" />
            </div>
          </div>
        </div>
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}
