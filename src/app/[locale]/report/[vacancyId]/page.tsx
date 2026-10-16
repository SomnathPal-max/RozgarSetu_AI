import { setRequestLocale } from 'next-intl/server';
import { ReportListingClient } from '@/components/ReportListingClient';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  const ids = ['notice-a', 'notice-b', 'notice-c', 'msme-delivery', 'msme-packaging', 'msme-billing', 'demo'];
  const params: { locale: string; vacancyId: string }[] = [];
  for (const locale of locales) {
    for (const vacancyId of ids) {
      params.push({ locale, vacancyId });
    }
  }
  return params;
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ locale: string; vacancyId: string }>;
}) {
  const { locale, vacancyId } = await params;
  setRequestLocale(locale);

  return <ReportListingClient vacancyId={vacancyId} locale={locale as Locale} />;
}
