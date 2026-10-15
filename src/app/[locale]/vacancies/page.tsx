import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Search } from 'lucide-react';
import { locales } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function VacanciesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('screen2');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t('findVacancies')}</h1>
      <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
        <Search className="w-5 h-5 text-slate-400" aria-hidden="true" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="flex-1 text-sm outline-none min-h-[44px] bg-transparent"
          aria-label={t('searchPlaceholder')}
        />
      </div>
      <p className="text-sm text-slate-500 text-center py-8">
        Vacancy listings will appear here in Phase 2.
      </p>
    </div>
  );
}
