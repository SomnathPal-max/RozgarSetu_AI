import { setRequestLocale } from 'next-intl/server';
import { VacancyFinderClient } from '@/components/VacancyFinderClient';
import { fetchVacanciesList, type VacancyItem } from '@/lib/vacancies';
import { locales, type Locale } from '@/i18n/config';

export const dynamic = 'force-dynamic';

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

  let initialVacancies: VacancyItem[] = [];
  let loadError: string | null = null;

  try {
    initialVacancies = await fetchVacanciesList();
  } catch (err) {
    console.error('SSR fetchVacanciesList failed:', err);
    loadError = 'Failed to load vacancies from server. Please retry.';
  }

  return (
    <VacancyFinderClient
      locale={locale as Locale}
      initialVacancies={initialVacancies}
      loadError={loadError}
    />
  );
}
