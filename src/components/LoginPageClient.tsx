'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  LogIn,
  Lock,
  Phone,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  UserCheck,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

interface LoginPageClientProps {
  locale: Locale;
}

export function LoginPageClient({ locale }: LoginPageClientProps) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile.trim(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(t('loginSuccess'));
        setTimeout(() => {
          window.location.href = `/${locale}/saved`;
        }, 600);
      } else {
        setError(data.error || 'Login failed. Please verify credentials.');
      }
    } catch {
      setError('Network error during login. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoMobile: string, demoPass: string) => {
    setMobile(demoMobile);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="space-y-6 max-w-md mx-auto py-2">
      {/* Back button */}
      <div>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{tCommon('back')}</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="space-y-1">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t('loginTitle')}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="mobile-input"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              {t('mobileNumber')} *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                id="mobile-input"
                type="tel"
                required
                maxLength={10}
                placeholder={t('mobilePlaceholder')}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password-input"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              {t('password')} *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] justify-center"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 text-white font-bold text-sm py-3 px-4 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 min-h-[48px]"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? tCommon('loading') : tCommon('login')}</span>
          </button>
        </form>

        {/* Switch to Register */}
        <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100 space-y-1">
          <p>{t('noAccount')}</p>
          <Link
            href={`/${locale}/auth/register`}
            className="inline-block font-bold text-blue-600 hover:text-blue-800 underline min-h-[44px] py-2"
          >
            {t('createAccountLink')} →
          </Link>
        </div>
      </div>

      {/* Quick Demo Credentials Card */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>{t('demoTitle')}</span>
          </span>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
            Evaluation
          </span>
        </div>
        <p className="text-[11px] text-slate-600">
          {t('demoHint')}
        </p>

        <button
          type="button"
          onClick={() => handleFillDemo('0000000001', 'demo_user_123')}
          className="w-full text-left p-2.5 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 transition-colors text-xs flex items-center justify-between shadow-2xs min-h-[44px]"
        >
          <div>
            <div className="font-bold text-slate-900">{t('demoCandidate')}</div>
            <div className="font-mono text-slate-500 text-[11px]">0000000001</div>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
            Click to fill
          </span>
        </button>

        <div className="pt-2 border-t border-indigo-100 text-[11px] text-slate-600 flex items-center justify-between">
          <span>{t('reviewerLink')}</span>
          <Link
            href={`/${locale}/admin/login`}
            className="font-bold text-indigo-700 hover:underline flex items-center gap-1"
          >
            <Shield className="w-3 h-3" />
            <span>{t('reviewerLinkBtn')}</span>
          </Link>
        </div>
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}
