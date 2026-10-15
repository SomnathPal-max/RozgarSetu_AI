import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function SavedJobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('screen6');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t('savedJobs')}</h1>
      <p className="text-sm text-slate-500 text-center py-8">
        {t('noSavedJobs')}
      </p>
    </div>
  );
}
