import { setRequestLocale } from 'next-intl/server';
import { VerificationReceiptPageClient } from '@/components/VerificationReceiptPageClient';
import { locales, type Locale } from '@/i18n/config';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function VerifyReceiptPage({
  params,
}: {
  params: Promise<{ locale: string; hash: string }>;
}) {
  const { locale, hash } = await params;
  setRequestLocale(locale);

  return <VerificationReceiptPageClient hash={hash} locale={locale as Locale} />;
}
