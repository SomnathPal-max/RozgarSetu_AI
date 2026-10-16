import { setRequestLocale } from 'next-intl/server';
import { ReviewerQueueClient } from '@/components/ReviewerQueueClient';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ReviewerQueueClient locale={locale as Locale} />;
}
