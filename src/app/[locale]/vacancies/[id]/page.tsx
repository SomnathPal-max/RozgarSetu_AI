import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale, id: 'demo' }));
}

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('screen3');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t('vacancyDetails')}</h1>
      <p className="text-sm text-slate-500 text-center py-8">
        Vacancy details will appear here in Phase 2.
      </p>
    </div>
  );
}
