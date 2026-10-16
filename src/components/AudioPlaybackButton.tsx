'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { localeSpeechCodes, type Locale } from '@/i18n/config';

interface AudioPlaybackButtonProps {
  textToSpeak: string;
  locale: Locale;
}

export function AudioPlaybackButton({ textToSpeak, locale }: AudioPlaybackButtonProps) {
  const t = useTranslations('screen4');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
      setIsSupported(supported);
    }
  }, []);

  const handlePlay = () => {
    if (!isSupported) {
      setShowFallback(true);
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterances
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const targetLang = localeSpeechCodes[locale] || 'en-IN';
      utterance.lang = targetLang;
      utterance.rate = 0.95; // Slightly slower for clarity

      // Try to find a matching voice for the locale
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => v.lang.startsWith(locale) || v.lang.includes(targetLang));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = (e) => {
        console.warn('Speech synthesis error or fallback:', e);
        setIsPlaying(false);
        setShowFallback(true);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Web speech execution failed:', err);
      setIsPlaying(false);
      setShowFallback(true);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <button
        onClick={handlePlay}
        className={`w-full rounded-xl py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 min-h-[48px] shadow-xs ${
          isPlaying
            ? 'bg-amber-600 text-white hover:bg-amber-700'
            : 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950'
        }`}
        aria-label={isPlaying ? 'Stop listening' : t('listenResult')}
      >
        {isPlaying ? (
          <>
            <Square className="w-4 h-4 fill-current animate-pulse" />
            <span>Stop listening</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            <span>{t('listenResult')}</span>
          </>
        )}
      </button>

      {showFallback && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
          <VolumeX className="w-3.5 h-3.5 shrink-0" />
          <span>{t('audioNotAvailable')}</span>
        </div>
      )}
    </div>
  );
}
