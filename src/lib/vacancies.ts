import { db } from '@/db';
import { vacancies, sources, verificationChecks, scamFlags } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface VacancyItem {
  id: string;
  type: 'government' | 'msme';
  title: string;
  orgName: string;
  area: string;
  publishedOn: string;
  lastDate: string;
  lastCheckedAt: string;
  advertisedPayMin?: number | null;
  advertisedPayMax?: number | null;
  sourceName?: string;
  completedChecksCount: number;
  totalChecksCount: number;
  hasContactVerified: boolean;
  redFlagCount: number;
  isHighRisk: boolean;
}

export async function fetchVacanciesList(typeFilter?: string | null, query?: string | null): Promise<VacancyItem[]> {
  // Query active vacancies (suspended vacancies are hidden per AGENTS.md rules)
  const allVacancies = await db
    .select({
      vacancy: vacancies,
      source: sources,
    })
    .from(vacancies)
    .leftJoin(sources, eq(vacancies.sourceId, sources.id))
    .where(eq(vacancies.status, 'active'));

  // Fetch verification checks and scam flags for each vacancy
  const results: VacancyItem[] = await Promise.all(
    allVacancies.map(async ({ vacancy, source }) => {
      const checks = await db
        .select()
        .from(verificationChecks)
        .where(eq(verificationChecks.vacancyId, vacancy.id));

      const flags = await db
        .select()
        .from(scamFlags)
        .where(eq(scamFlags.vacancyId, vacancy.id));

      const completedChecks = checks.filter((c) => c.completed);
      const scamFlag = flags[0];

      let redFlagCount = 0;
      if (scamFlag) {
        if (scamFlag.asksFee) redFlagCount++;
        if (scamFlag.personalNumberOnly) redFlagCount++;
        if (scamFlag.noBusinessDetails) redFlagCount++;
        if (scamFlag.unrealisticPay) redFlagCount++;
        if (scamFlag.urgencyPressure) redFlagCount++;
      }

      return {
        id: vacancy.id,
        type: vacancy.type as 'government' | 'msme',
        title: vacancy.title,
        orgName: vacancy.orgName,
        area: vacancy.area,
        publishedOn: vacancy.publishedOn,
        lastDate: vacancy.lastDate,
        lastCheckedAt: vacancy.lastCheckedAt,
        advertisedPayMin: vacancy.advertisedPayMin,
        advertisedPayMax: vacancy.advertisedPayMax,
        sourceName: source?.bodyName ?? vacancy.orgName,
        completedChecksCount: completedChecks.length,
        totalChecksCount: checks.length,
        hasContactVerified: completedChecks.some((c) => c.checkKey === 'contact_called_back'),
        redFlagCount,
        isHighRisk: redFlagCount > 0,
      };
    })
  );

  let filtered = results;
  if (typeFilter && typeFilter !== 'all') {
    filtered = filtered.filter((v) => v.type === typeFilter);
  }
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.orgName.toLowerCase().includes(q) ||
        v.area.toLowerCase().includes(q)
    );
  }

  return filtered;
}
