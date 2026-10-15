import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale, id: 'demo' }));
}

export default async function EligibilityCheckPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('screen4');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t('eligibilityResult')}</h1>
      <p className="text-sm text-slate-500 text-center py-8">
        Eligibility results will appear here in Phase 3.
      </p>
    </div>
  );
}
