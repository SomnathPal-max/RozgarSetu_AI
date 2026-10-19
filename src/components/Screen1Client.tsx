'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search, UserPlus, LogIn } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ProfileModal } from '@/components/ProfileModal';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

interface Screen1ClientProps {
  locale: Locale;
}

export function Screen1Client({ locale }: Screen1ClientProps) {
  const t = useTranslations('screen1');
  const [modalMode, setModalMode] = useState<'no_account' | 'create_account' | null>(null);

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] justify-between">
      <div className="flex flex-col items-center gap-6 py-4">
        {/* Language selector buttons */}
        <section className="w-full text-center space-y-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('selectLanguage')}
          </h2>
          <div className="flex justify-center">
            <LanguageSwitcher currentLocale={locale} variant="buttons" />
          </div>
        </section>

        {/* Welcome message */}
        <section className="text-center space-y-1.5 pt-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('welcome')}
          </h1>
          <p className="text-slate-600 text-sm max-w-xs mx-auto">
            {t('subtitle')}
          </p>
        </section>

        {/* Action cards matching Screen 1 mock-up */}
        <section className="w-full space-y-4 pt-2">
          {/* Card 1: Check eligibility now (no account, not stored) */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2">
            <p className="text-xs text-blue-900/80 leading-relaxed font-medium">
              Check eligibility without an account. Your details are not stored.
            </p>
            <button
              onClick={() => setModalMode('no_account')}
              className="w-full rounded-xl bg-blue-600 py-3.5 px-4 text-white font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Search className="w-4 h-4" />
              <span>{t('checkEligibility')}</span>
            </button>
          </div>

          {/* Card 2: Create account & Log In */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href={`/${locale}/auth/register`}
                className="w-full rounded-xl border-2 border-slate-300 bg-white py-3 px-3 text-slate-800 font-bold text-xs sm:text-sm hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
              >
                <UserPlus className="w-4 h-4 text-slate-600" />
                <span>{t('createAccount')}</span>
              </Link>
              <Link
                href={`/${locale}/auth/login`}
                className="w-full rounded-xl bg-slate-900 text-white py-3 px-3 font-bold text-xs sm:text-sm hover:bg-black active:bg-slate-800 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
              >
                <LogIn className="w-4 h-4 text-slate-300" />
                <span>Log In</span>
              </Link>
            </div>
            <p className="text-[11px] text-slate-500 text-center leading-normal">
              Private candidate accounts: each user securely manages their own applications, notes, and exam schedules.
            </p>
          </div>

          {/* Quick Evaluator Guide: "Try it in 2 minutes" */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>⏱️ Try it in 2 minutes (Evaluator Guide)</span>
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                Judge Tour
              </span>
            </div>

            <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                <strong>Check Eligibility:</strong> Click above to test Notice A. Pure engine rules determine age and education matches.
              </li>
              <li>
                <strong>Gap Coach & Receipt:</strong> Open Gap Coach for action steps, hear spoken explanation, or download PDF receipt.
              </li>
              <li>
                <strong>Notice Watch:</strong> Save Notice A, simulate a corrigendum deadline update, and see instant live alerts.
              </li>
              <li>
                <strong>Scam Shield & Dual Review:</strong> File a scam flag on an MSME notice and test the server-enforced two-reviewer queue.
              </li>
            </ol>

            <div className="pt-2 border-t border-indigo-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
                <span>Demo Accounts (Fictitious Numbers)</span>
                <Link
                  href={`/${locale}/admin/login`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline font-bold"
                >
                  Reviewer Portal →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                <div className="bg-white p-2 rounded-lg border border-indigo-100">
                  <div className="font-semibold text-slate-800">Job Seeker</div>
                  <div className="font-mono text-slate-600">0000000001</div>
                  <div className="text-[10px] text-slate-400">Pass: demo_user_123</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-indigo-100">
                  <div className="font-semibold text-slate-800">Reviewer 1</div>
                  <div className="font-mono text-slate-600">0000000002</div>
                  <div className="text-[10px] text-slate-400">Pass: demo_review_123</div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic">
                * All passwords and mobile numbers are strictly invented demo data.
              </p>
            </div>

            {/* Reset Demo Data Button */}
            <div className="pt-1">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/reset-demo', { method: 'POST' });
                    if (res.ok) {
                      alert('✅ Demo database reset to initial seed successfully.');
                      window.location.reload();
                    } else {
                      alert('Failed to reset demo data.');
                    }
                  } catch {
                    alert('Error connecting to reset API.');
                  }
                }}
                className="w-full text-center py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors min-h-[40px]"
              >
                🔄 Reset Demo Data (Restore Initial State)
              </button>
            </div>
          </div>
        </section>
      </div>

      <BottomNav locale={locale} />

      <ProfileModal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        mode={modalMode ?? 'no_account'}
        locale={locale}
      />
    </div>
  );
}
