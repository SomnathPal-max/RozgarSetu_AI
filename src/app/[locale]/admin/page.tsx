import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ReviewerQueueClient } from '@/components/ReviewerQueueClient';
import { locales, type Locale } from '@/i18n/config';

export const dynamic = 'force-dynamic';

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

  // Server-side access control enforcement per plan requirements
  const cookieStore = await cookies();
  const role = cookieStore.get('rozgarsetu_role')?.value;

  if (!role || (role !== 'reviewer' && role !== 'reviewer2' && role !== 'admin')) {
    redirect(`/${locale}/admin/login`);
  }

  return <ReviewerQueueClient locale={locale as Locale} />;
}
