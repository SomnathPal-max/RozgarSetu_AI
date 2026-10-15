'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <header className="sticky top-0 z-50 bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
      <h1 className="text-lg font-semibold tracking-tight">{t('appName')}</h1>
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
  );
}
