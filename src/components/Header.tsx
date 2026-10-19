'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe, Users, Trash2 } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [helperMode, setHelperMode] = useState(false);
  const [sessionCleared, setSessionCleared] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isHelper = localStorage.getItem('rozgarsetu_helper_mode') === 'true';
      setHelperMode(isHelper);
    }
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  const toggleHelperMode = () => {
    const next = !helperMode;
    setHelperMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rozgarsetu_helper_mode', String(next));
    }
  };

  const handleClearCitizenSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('rozgarsetu_user_profile');
      setSessionCleared(true);
      setTimeout(() => setSessionCleared(false), 3000);
      window.location.reload();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">{t('appName')}</span>
          <button
            type="button"
            onClick={toggleHelperMode}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
              helperMode
                ? 'bg-amber-400 text-amber-950 border-amber-300'
                : 'bg-blue-700/80 text-blue-100 border-blue-500 hover:bg-blue-700'
            }`}
            title="Toggle Helper Mode for CSC & Cyber Cafe Operators"
          >
            {helperMode ? '🤝 Helper ON' : 'CSC Helper'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5" aria-hidden="true" />
          <select
            value={locale}
            onChange={(e) => handleLocaleChange(e.target.value as Locale)}
            className="bg-blue-700 text-white text-sm rounded px-2 py-1 border border-blue-500 focus:outline-none focus:ring-2 focus:ring-white min-h-[44px]"
            aria-label={t('language')}
          >
            {locales.map((loc) => (
              <option key={loc} value={loc}>
                {localeNames[loc]}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Helper Mode Kiosk Banner */}
      {helperMode && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-xs border-b border-amber-600">
          <div className="flex items-center gap-1.5 truncate">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Helper Mode: Checking for a Citizen (Zero server storage)
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearCitizenSession}
            className="shrink-0 ml-2 bg-amber-950 text-amber-100 hover:bg-black px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>{sessionCleared ? 'Cleared ✓' : 'Clear Citizen'}</span>
          </button>
        </div>
      )}
    </>
  );
}
