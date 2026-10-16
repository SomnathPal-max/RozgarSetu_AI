import { setRequestLocale } from 'next-intl/server';
import { VacancyFinderClient } from '@/components/VacancyFinderClient';
import { locales, type Locale } from '@/i18n/config';

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

  return <VacancyFinderClient locale={locale as Locale} />;
}
