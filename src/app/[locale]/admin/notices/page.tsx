import { setRequestLocale } from 'next-intl/server';
import { AdminCorrigendumClient } from '@/components/AdminCorrigendumClient';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AdminNoticesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminCorrigendumClient locale={locale as Locale} />;
}
