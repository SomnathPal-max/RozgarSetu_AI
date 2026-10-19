import { setRequestLocale } from 'next-intl/server';
import { DocumentChecklistClient } from '@/components/DocumentChecklistClient';
import { locales, type Locale } from '@/i18n/config';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function VacancyDocumentsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <DocumentChecklistClient id={id} locale={locale as Locale} />;
}
