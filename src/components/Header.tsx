'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Globe, Users, Trash2, LogIn, LogOut, User } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';

interface HeaderProps {
  locale: Locale;
}

interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  role: string;
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [helperMode, setHelperMode] = useState(false);
  const [sessionCleared, setSessionCleared] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isHelper = localStorage.getItem('rozgarsetu_helper_mode') === 'true';
      setHelperMode(isHelper);

      // Check current auth status
      fetch('/api/auth/me')
        .then((res) => (res.ok ? res.json() : { authenticated: false }))
        .then((data) => {
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
          } else {
            setCurrentUser(null);
          }
        })
        .catch(() => setCurrentUser(null));
    }
  }, [pathname]);

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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('rozgarsetu_user_profile');
        window.location.href = `/${locale}`;
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-blue-600 text-white px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-md gap-2">
        {/* App Title & CSC Helper Toggle */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/${locale}`}
            className="text-base sm:text-lg font-semibold tracking-tight hover:text-blue-100 transition-colors truncate"
          >
            {t('appName')}
          </Link>
          <button
            type="button"
            onClick={toggleHelperMode}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors shrink-0 ${
              helperMode
                ? 'bg-amber-400 text-amber-950 border-amber-300'
                : 'bg-blue-700/80 text-blue-100 border-blue-500 hover:bg-blue-700'
            }`}
            title="Toggle Helper Mode for CSC & Cyber Cafe Operators"
          >
            {helperMode ? '🤝 Helper ON' : 'CSC Helper'}
          </button>
        </div>

        {/* Right Actions: User Account / Login / Logout & Language Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* User Auth Section */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-blue-700/70 py-1 px-2 rounded-lg border border-blue-500/80">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-100 max-w-[120px] truncate">
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{currentUser.name.split(' ')[0]}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-md transition-colors min-h-[44px] shadow-2xs"
                title="Log Out of your account"
                aria-label={t('logout')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? '...' : t('logout')}</span>
              </button>
            </div>
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-blue-400/80 transition-colors min-h-[44px] shadow-2xs"
              aria-label={t('login')}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('login')}</span>
            </Link>
          )}

          {/* Language Switcher */}
          <div className="flex items-center gap-1">
            <Globe className="w-4 h-4 text-blue-200 hidden sm:block" aria-hidden="true" />
            <select
              value={locale}
              onChange={(e) => handleLocaleChange(e.target.value as Locale)}
              className="bg-blue-700 text-white text-xs sm:text-sm rounded px-1.5 py-1.5 border border-blue-500 focus:outline-none focus:ring-2 focus:ring-white min-h-[44px]"
              aria-label={t('language')}
            >
              {locales.map((loc) => (
                <option key={loc} value={loc}>
                  {localeNames[loc]}
                </option>
              ))}
            </select>
          </div>
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
