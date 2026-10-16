import { setRequestLocale } from 'next-intl/server';
import { EligibilityCheckClient } from '@/components/EligibilityCheckClient';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  const ids = ['notice-a', 'notice-b', 'notice-c', 'msme-delivery', 'msme-packaging', 'msme-billing', 'demo'];
  const params: { locale: string; id: string }[] = [];
  for (const locale of locales) {
    for (const id of ids) {
      params.push({ locale, id });
    }
  }
  return params;
}

export default async function EligibilityCheckPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <EligibilityCheckClient id={id} locale={locale as Locale} />;
}
