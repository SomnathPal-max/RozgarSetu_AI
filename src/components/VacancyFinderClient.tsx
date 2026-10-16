'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Search, ShieldAlert, CheckCircle2, AlertCircle, Building2, Briefcase } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

interface VacancyItem {
  id: string;
  type: 'government' | 'msme';
  title: string;
  orgName: string;
  area: string;
  publishedOn: string;
  lastDate: string;
  lastCheckedAt: string;
  advertisedPayMin?: number;
  advertisedPayMax?: number;
  completedChecksCount: number;
  totalChecksCount: number;
  hasContactVerified: boolean;
  redFlagCount: number;
  isHighRisk: boolean;
}

interface VacancyFinderClientProps {
  locale: Locale;
}

export function VacancyFinderClient({ locale }: VacancyFinderClientProps) {
  const t = useTranslations('screen2');
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'government' | 'msme' | 'closing_soon'>('all');

  useEffect(() => {
    async function loadVacancies() {
      try {
        setLoading(true);
        const res = await fetch('/api/vacancies');
        if (res.ok) {
          const data = await res.json();
          setVacancies(data.vacancies || []);
        }
      } catch (err) {
        console.error('Failed to fetch vacancies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVacancies();
  }, []);

  const filteredVacancies = vacancies.filter((v) => {
    // Type filter
    if (filterType === 'government' && v.type !== 'government') return false;
    if (filterType === 'msme' && v.type !== 'msme') return false;
    if (filterType === 'closing_soon') {
      const daysLeft = Math.ceil(
        (new Date(v.lastDate).getTime() - new Date('2026-10-15').getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft > 30) return false;
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.orgName.toLowerCase().includes(q) ||
        v.area.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] justify-between space-y-4">
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('findVacancies')}</h1>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
            aria-label={t('searchPlaceholder')}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs" role="tablist">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap min-h-[44px] transition-colors ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('allListings')}
          </button>
          <button
            onClick={() => setFilterType('government')}
            className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap min-h-[44px] flex items-center gap-1.5 transition-colors ${
              filterType === 'government'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('government')}</span>
          </button>
          <button
            onClick={() => setFilterType('msme')}
            className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap min-h-[44px] flex items-center gap-1.5 transition-colors ${
              filterType === 'msme'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{t('localMSME')}</span>
          </button>
          <button
            onClick={() => setFilterType('closing_soon')}
            className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap min-h-[44px] transition-colors ${
              filterType === 'closing_soon'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('closingSoon')}
          </button>
        </div>

        {/* Vacancy Card List */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading vacancies...</div>
        ) : filteredVacancies.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No vacancies found matching your filter.</div>
        ) : (
          <div className="space-y-3">
            {filteredVacancies.map((vac) => {
              const formattedDate = new Date(vac.lastDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <Link
                  key={vac.id}
                  href={`/${locale}/vacancies/${vac.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-xs transition-all"
                >
                  <div className="space-y-2">
                    {/* Vacancy Title */}
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-bold text-slate-900 leading-snug">
                        {vac.title}
                      </h2>
                      <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 shrink-0">
                        {vac.type === 'government' ? 'Govt' : 'MSME'}
                      </span>
                    </div>

                    {/* Fictional Org name and Area */}
                    <p className="text-xs text-slate-600">
                      {vac.id === 'notice-a' ? 'Illustrative Notice A · Example Recruiting Body' : `${vac.orgName} · ${vac.area}`}
                    </p>

                    {/* Pay if MSME */}
                    {vac.advertisedPayMin && (
                      <p className="text-xs font-medium text-slate-800">
                        Pay range advertised: Rs {vac.advertisedPayMin.toLocaleString()} to {vac.advertisedPayMax?.toLocaleString()}
                      </p>
                    )}

                    {/* Dates metadata */}
                    <p className="text-[11px] text-slate-500">
                      Last date: {formattedDate} · Checked 14 Oct 2026
                    </p>

                    {/* Verification Badges & Scam Shield Flags */}
                    <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                      {/* Source checked badge for Government notice */}
                      {vac.type === 'government' && vac.completedChecksCount >= 3 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-700 text-white px-2 py-0.5 text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t('sourceChecked')}</span>
                        </span>
                      )}

                      {/* Contact not yet verified badge for MSME Delivery helper */}
                      {vac.type === 'msme' && !vac.hasContactVerified && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-medium border border-slate-200">
                          <AlertCircle className="w-3 h-3 text-slate-500" />
                          <span>{t('contactNotVerified')}</span>
                        </span>
                      )}

                      {/* Contact verified badge for verified MSME */}
                      {vac.type === 'msme' && vac.hasContactVerified && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-medium border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Contact verified</span>
                        </span>
                      )}

                      {/* Scam Shield Red Flag pill */}
                      {vac.redFlagCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 text-white px-2 py-0.5 text-xs font-semibold">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Scam Shield: {vac.redFlagCount} red flag</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}
