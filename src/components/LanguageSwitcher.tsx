'use client';

import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  variant?: 'buttons' | 'dropdown';
}

export function LanguageSwitcher({ currentLocale, variant = 'buttons' }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  if (variant === 'dropdown') {
    return (
      <select
        value={currentLocale}
        onChange={(e) => handleLocaleChange(e.target.value as Locale)}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Select language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Select language">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          className={`px-4 py-3 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
            currentLocale === loc
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          role="radio"
          aria-checked={currentLocale === loc}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}
