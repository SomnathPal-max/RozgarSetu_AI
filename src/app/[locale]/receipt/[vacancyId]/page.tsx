import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale, vacancyId: 'demo' }));
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ locale: string; vacancyId: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('screen8');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t('eligibilityReceipt')}</h1>
      <p className="text-sm text-slate-500 text-center py-8">
        Eligibility receipt will appear here in Phase 6.
      </p>
    </div>
  );
}
