import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';

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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Simulate Corrigendum</h1>
      <p className="text-sm text-slate-500 text-center py-8">
        Corrigendum simulation tool will appear here in Phase 4.
      </p>
    </div>
  );
}
