import { setRequestLocale } from 'next-intl/server';
import { LoginPageClient } from '@/components/LoginPageClient';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginPageClient locale={locale as Locale} />;
}
