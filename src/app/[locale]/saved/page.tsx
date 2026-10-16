import { setRequestLocale } from 'next-intl/server';
import { SavedJobsClient } from '@/components/SavedJobsClient';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function SavedJobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SavedJobsClient locale={locale as Locale} />;
}
