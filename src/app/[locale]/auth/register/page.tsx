import { setRequestLocale } from 'next-intl/server';
import { RegisterPageClient } from '@/components/RegisterPageClient';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RegisterPageClient locale={locale as Locale} />;
}
