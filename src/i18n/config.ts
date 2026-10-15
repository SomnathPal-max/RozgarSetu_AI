export const locales = ['en', 'bn', 'hi'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  bn: 'বাংলা',
  hi: 'हिन्दी',
};

export const localeSpeechCodes: Record<Locale, string> = {
  en: 'en-IN',
  bn: 'bn-IN',
  hi: 'hi-IN',
};
