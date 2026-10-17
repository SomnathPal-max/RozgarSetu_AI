'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { X, UserCheck } from 'lucide-react';
import { saveSessionProfile, type UserProfile } from '@/lib/profile';
import { type QualificationLevel } from '@/engine';
import { type Locale } from '@/i18n/config';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'no_account' | 'create_account';
  locale: Locale;
}

export function ProfileModal({ isOpen, onClose, mode, locale }: ProfileModalProps) {
  const t = useTranslations('profileForm');
  const router = useRouter();

  // Pre-filled with mock-up test profile defaults (Screen 4 reproduction: Age 24, Higher Secondary, category blank)
  const [name, setName] = useState('Illustrative Candidate');
  const [mobile, setMobile] = useState('0000000001');
  const [dob, setDob] = useState('2002-05-15');
  const [qualification, setQualification] = useState<QualificationLevel>('higher_secondary');
  const [category, setCategory] = useState<string>('');
  const [disability, setDisability] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const profileData: UserProfile = {
      name: name.trim(),
      mobile: mobile.trim(),
      dob: dob.trim(),
      qualificationLevel: qualification,
      qualificationStream: 'General',
      category: category.trim() === '' ? undefined : category.trim(),
      disability: disability.trim() === '' ? undefined : disability.trim(),
      isAccount: mode === 'create_account',
    };

    // Rule 8: No-account check keeps profile in memory / sessionStorage ONLY.
    // It is NEVER persisted to the server.
    saveSessionProfile(profileData);

    if (mode === 'create_account') {
      try {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        });
      } catch (err) {
        console.error('Account registration error:', err);
      }
    }

    setIsSubmitting(false);
    onClose();
    router.push(`/${locale}/vacancies`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-slate-900">
              {mode === 'no_account' ? t('title') : t('createAccountTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'no_account' ? t('noAccountSubtitle') : t('createAccountSubtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'no_account' && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2 text-xs text-emerald-800">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Private session:</strong> Your data remains strictly in your device’s memory.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create_account' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('name')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          {mode === 'create_account' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('mobile')}
              </label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder={t('mobilePlaceholder')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          <div>
            <label htmlFor="dob" className="block text-xs font-semibold text-slate-700 mb-1">
              {t('dob')} *
            </label>
            <input
              id="dob"
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="qualificationLevel" className="block text-xs font-semibold text-slate-700 mb-1">
              {t('qualification')} *
            </label>
            <select
              id="qualificationLevel"
              value={qualification}
              onChange={(e) => setQualification(e.target.value as QualificationLevel)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="below_secondary">{t('qualifications.below_secondary')}</option>
              <option value="secondary">{t('qualifications.secondary')}</option>
              <option value="higher_secondary">{t('qualifications.higher_secondary')}</option>
              <option value="diploma_iti">{t('qualifications.diploma_iti')}</option>
              <option value="graduate">{t('qualifications.graduate')}</option>
              <option value="postgraduate">{t('qualifications.postgraduate')}</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {t('category')}
              </label>
              <span className="text-[11px] text-slate-400">Optional</span>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">{t('categoryNone')}</option>
              <option value="SC">SC (Scheduled Caste)</option>
              <option value="ST">ST (Scheduled Tribe)</option>
              <option value="OBC">OBC (Other Backward Classes)</option>
              <option value="GEN">General (Unreserved)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">{t('categoryHint')}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {t('disability')}
              </label>
              <span className="text-[11px] text-slate-400">Optional</span>
            </div>
            <select
              value={disability}
              onChange={(e) => setDisability(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">{t('disabilityNone')}</option>
              <option value="locomotor">Locomotor Disability</option>
              <option value="visual">Visual Impairment</option>
              <option value="hearing">Hearing Impairment</option>
            </select>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px]"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 min-h-[44px] shadow-sm disabled:opacity-50"
            >
              {mode === 'no_account' ? t('continue') : t('saveAndCheck')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
