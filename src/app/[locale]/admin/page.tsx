import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';

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
  const t = await getTranslations('screen9');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t('reviewerQueue')}</h1>
      <p className="text-sm text-slate-500 text-center py-8">
        Reviewer queue will appear here in Phase 5.
      </p>
    </div>
  );
}
