'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  UserPlus,
  Lock,
  Phone,
  User,
  Calendar,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

interface RegisterPageClientProps {
  locale: Locale;
}

export function RegisterPageClient({ locale }: RegisterPageClientProps) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tProfile = useTranslations('profileForm');

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dob, setDob] = useState('2002-05-15');
  const [qualificationLevel, setQualificationLevel] = useState('higher_secondary');
  const [category, setCategory] = useState('');
  const [disability, setDisability] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (!/^\d{10}$/.test(mobile.trim())) {
        setError('Please enter a valid 10-digit mobile number');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          password,
          dob: dob.trim(),
          qualificationLevel,
          category: category.trim() || null,
          disability: disability.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(t('registerSuccess'));
        setTimeout(() => {
          window.location.href = `/${locale}/saved`;
        }, 600);
      } else {
        setError(data.error || 'Failed to create account. Please try again.');
      }
    } catch {
      setError('Network error during registration. Please check connection.');
    } finally {
      setLoading(false);
    }
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
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t('registerTitle')}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('registerSubtitle')}
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="reg-name"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              {t('fullName')} *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                id="reg-name"
                type="text"
                required
                placeholder={t('namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label
              htmlFor="reg-mobile"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              {t('mobileNumber')} *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                id="reg-mobile"
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

          {/* Password */}
          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              {t('password')} *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="reg-password"
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

          {/* Date of Birth & Qualification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="reg-dob"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                {t('dob')} *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  id="reg-dob"
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-qual"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                {t('qualification')} *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <select
                  id="reg-qual"
                  required
                  value={qualificationLevel}
                  onChange={(e) => setQualificationLevel(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                >
                  <option value="below_secondary">{tProfile('qualifications.below_secondary')}</option>
                  <option value="secondary">{tProfile('qualifications.secondary')}</option>
                  <option value="higher_secondary">{tProfile('qualifications.higher_secondary')}</option>
                  <option value="diploma_iti">{tProfile('qualifications.diploma_iti')}</option>
                  <option value="graduate">{tProfile('qualifications.graduate')}</option>
                  <option value="postgraduate">{tProfile('qualifications.postgraduate')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category & Disability (Optional per AGENTS.md rule 9) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Statutory Relaxations (Optional)</span>
            </div>

            <div>
              <label
                htmlFor="reg-category"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                {t('category')}
              </label>
              <select
                id="reg-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
              >
                <option value="">{t('categoryGeneral')}</option>
                <option value="SC">{t('categorySC')}</option>
                <option value="ST">{t('categoryST')}</option>
                <option value="OBC">{t('categoryOBC')}</option>
              </select>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {t('categoryHint')}
              </span>
            </div>

            <div>
              <label
                htmlFor="reg-disability"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                {t('disability')}
              </label>
              <select
                id="reg-disability"
                value={disability}
                onChange={(e) => setDisability(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
              >
                <option value="">{t('disabilityNone')}</option>
                <option value="PwBD">{t('disabilityPwBD')}</option>
              </select>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {t('disabilityHint')}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 text-white font-bold text-sm py-3 px-4 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 min-h-[48px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? tCommon('loading') : t('registerTitle')}</span>
          </button>
        </form>

        {/* Switch to Login */}
        <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100 space-y-1">
          <p>{t('haveAccount')}</p>
          <Link
            href={`/${locale}/auth/login`}
            className="inline-block font-bold text-blue-600 hover:text-blue-800 underline min-h-[44px] py-2"
          >
            {t('loginLink')} →
          </Link>
        </div>
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}
