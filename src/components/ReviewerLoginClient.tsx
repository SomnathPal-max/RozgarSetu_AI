'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert, UserCheck, ArrowLeft, KeyRound } from 'lucide-react';
import { type Locale } from '@/i18n/config';

interface ReviewerLoginClientProps {
  locale: Locale;
}

export function ReviewerLoginClient({ locale }: ReviewerLoginClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (persona: 'reviewer-1' | 'reviewer-2' | 'admin') => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/auth/reviewer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }),
      });

      if (res.ok) {
        window.location.href = `/${locale}/admin`;
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error during reviewer authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto py-4">
      {/* Back button */}
      <div>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Job Search</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 shadow-md space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Reviewer & Curator Portal</h1>
        <p className="text-xs text-slate-300 leading-relaxed">
          Authorized personnel only. Review community scam flags, verify contact details, and execute dual-approval actions under Scam Shield.
        </p>
      </div>

      {/* Access Restriction Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 space-y-1">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Restricted Access Control</span>
        </div>
        <p>
          Per project rules, reviewer queues are hidden from ordinary job seekers and enforced on the server. Select a demo persona below to proceed.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* 1-Click Demo Personas */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
          Demo Reviewer Personas (Evaluation Mode)
        </h2>

        {/* Reviewer 1 Button */}
        <button
          onClick={() => handleLogin('reviewer-1')}
          disabled={loading}
          className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-xs transition-all space-y-1.5 min-h-[44px]"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Demo Reviewer 1 (Proposer)
            </span>
            <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Mobile: 0000000002
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Can verify checklist badges, contact recruiting bodies, and propose listing suspension.
          </p>
        </button>

        {/* Reviewer 2 Button */}
        <button
          onClick={() => handleLogin('reviewer-2')}
          disabled={loading}
          className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-500 hover:shadow-xs transition-all space-y-1.5 min-h-[44px]"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Demo Reviewer 2 (Second Approver)
            </span>
            <span className="text-[11px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              Mobile: 0000000003
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Independent reviewer required to approve high-risk suspension under the two-reviewer rule.
          </p>
        </button>

        {/* Admin Button */}
        <button
          onClick={() => handleLogin('admin')}
          disabled={loading}
          className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-800 hover:shadow-xs transition-all space-y-1.5 min-h-[44px]"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-800" />
              Demo Administrator
            </span>
            <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
              Mobile: 0000000004
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Full system access, corrigendum publisher, and audit log inspector.
          </p>
        </button>
      </div>

      {/* Demo Credentials Disclaimer */}
      <div className="text-[11px] text-slate-400 text-center leading-relaxed px-4 pt-2">
        Passwords and mobile numbers are strictly fictional demo credentials for test evaluation.
      </div>
    </div>
  );
}
