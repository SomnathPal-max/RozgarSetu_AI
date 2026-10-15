'use client';

import { useTranslations } from 'next-intl';
import { type Locale } from '@/i18n/config';

interface IllustrativeFooterProps {
  locale: Locale;
}

export function IllustrativeFooter({ locale }: IllustrativeFooterProps) {
  const t = useTranslations('common');

  // Check if the current locale has _reviewed: false
  // Bengali and Hindi are marked as unreviewed drafts
  const isUnreviewedLocale = locale === 'bn' || locale === 'hi';

  return (
    <footer className="no-print border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500 space-y-1">
      <p className="font-medium text-slate-600">{t('illustrativeNotice')}</p>
      {isUnreviewedLocale && (
        <p className="text-amber-600 font-medium">
          {t('draftTranslation')}
        </p>
      )}
    </footer>
  );
}
