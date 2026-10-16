import { setRequestLocale } from 'next-intl/server';
import { EligibilityReceiptClient } from '@/components/EligibilityReceiptClient';
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

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ locale: string; vacancyId: string }>;
}) {
  const { locale, vacancyId } = await params;
  setRequestLocale(locale);

  return <EligibilityReceiptClient vacancyId={vacancyId} locale={locale as Locale} />;
}
