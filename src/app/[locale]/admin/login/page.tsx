import { setRequestLocale } from 'next-intl/server';
import { ReviewerLoginClient } from '@/components/ReviewerLoginClient';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ReviewerLoginClient locale={locale as Locale} />;
}
