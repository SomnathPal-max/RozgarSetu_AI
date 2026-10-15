import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { Header } from '@/components/Header';
import { IllustrativeFooter } from '@/components/IllustrativeFooter';
import '../globals.css';

export const metadata: Metadata = {
  title: 'RozgarSetu AI — Illustrative Prototype',
  description: 'A working demonstration on invented data. No real vacancies, users, or results.',
  other: {
    // Google Fonts loaded at runtime — gracefully degrades to system fonts if unavailable
    'google-fonts': 'Noto Sans Bengali, Noto Sans Devanagari, Inter',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function getFontClass(locale: string): string {
  switch (locale) {
    case 'bn':
      return 'font-bengali';
    case 'hi':
      return 'font-devanagari';
    default:
      return 'font-sans';
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const fontClass = getFontClass(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      {/* Noto Sans Bengali & Devanagari loaded via metadata links below */}
      <body
        className={`${fontClass} min-h-screen bg-slate-50`}
      >
        <NextIntlClientProvider messages={messages}>
          <div className="mx-auto max-w-md min-h-screen flex flex-col bg-white shadow-sm">
            <Header locale={locale as Locale} />
            <main className="flex-1 px-4 py-4">{children}</main>
            <IllustrativeFooter locale={locale as Locale} />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
