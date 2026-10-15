import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Search, UserPlus } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
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
  const t = await getTranslations();

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      {/* Language selector */}
      <section className="w-full text-center space-y-3">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          {t('screen1.selectLanguage')}
        </h2>
        <LanguageSwitcher currentLocale={locale as Locale} variant="buttons" />
      </section>

      {/* Welcome message */}
      <section className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">
          {t('screen1.welcome')}
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed max-w-xs mx-auto">
          {t('screen1.subtitle')}
        </p>
      </section>

      {/* Action cards */}
      <section className="w-full space-y-4">
        {/* No-account eligibility check */}
        <Link
          href={`/${locale}/vacancies`}
          className="block w-full rounded-xl border-2 border-blue-200 bg-blue-50 p-5 hover:border-blue-400 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-600 p-3 shrink-0">
              <Search className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 text-base">
                {t('screen1.checkEligibility')}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {t('screen1.checkEligibilityDesc')}
              </p>
            </div>
          </div>
        </Link>

        {/* Create account */}
        <Link
          href={`/${locale}/vacancies`}
          className="block w-full rounded-xl border-2 border-slate-200 bg-white p-5 hover:border-slate-400 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-slate-600 p-3 shrink-0">
              <UserPlus className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                {t('screen1.createAccount')}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {t('screen1.createAccountDesc')}
              </p>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
