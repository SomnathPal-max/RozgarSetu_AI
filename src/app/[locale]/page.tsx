import { setRequestLocale } from 'next-intl/server';
import { Screen1Client } from '@/components/Screen1Client';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Screen1Client locale={locale as Locale} />;
}
