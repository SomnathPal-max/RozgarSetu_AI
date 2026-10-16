'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, UserPlus } from 'lucide-react';
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

          {/* Card 2: Create account */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
            <button
              onClick={() => setModalMode('create_account')}
              className="w-full rounded-xl border-2 border-slate-300 bg-white py-3 px-4 text-slate-800 font-semibold text-sm hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
            >
              <UserPlus className="w-4 h-4 text-slate-600" />
              <span>{t('createAccount')}</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center leading-normal">
              Only necessary details are asked: name, mobile, date of birth, qualification.
            </p>
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
