import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Bengali, Noto_Sans_Devanagari } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { Header } from '@/components/Header';
import { IllustrativeFooter } from '@/components/IllustrativeFooter';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-bengali',
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-devanagari',
});

export const metadata: Metadata = {
  title: 'RozgarSetu AI — Illustrative Prototype',
  description: 'A working demonstration on invented data. No real vacancies, users, or results.',
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
      <body
        className={`${inter.variable} ${notoBengali.variable} ${notoDevanagari.variable} ${fontClass} min-h-screen bg-slate-50`}
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
