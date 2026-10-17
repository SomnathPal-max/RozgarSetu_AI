/**
 * RozgarSetu AI — Pure Eligibility Rules Engine
 *
 * Rules decide eligibility. A language model NEVER decides eligibility.
 * Core eligibility must work with the LLM switched off (EXPLAIN_WITH_LLM=false is the default).
 *
 * Four result states only: matched | not_met | missing_data | manual_review.
 * When a rule is ambiguous, conflicts, or data is missing, return manual_review or missing_data. Never guess.
 *
 * Do NOT produce a single overall "eligible / not eligible" verdict. Show per-criterion results and a count summary only.
 * This module has ZERO database or network access.
 */

export type QualificationLevel =
  | 'below_secondary'
  | 'secondary'
  | 'higher_secondary'
  | 'diploma_iti'
  | 'graduate'
  | 'postgraduate';

export const QUALIFICATION_ORDER: Record<QualificationLevel, number> = {
  below_secondary: 0,
  secondary: 1,
  higher_secondary: 2,
  diploma_iti: 3,
  graduate: 4,
  postgraduate: 5,
};

export interface Profile {
  dob?: string; // ISO date string YYYY-MM-DD
  qualificationLevel?: QualificationLevel;
  qualificationStream?: string;
  category?: string; // 'SC' | 'ST' | 'OBC' | 'GEN' (optional per AGENTS.md rule 9)
  disability?: string;
}

export type CriterionType =
  | 'age'
  | 'qualification'
  | 'category_relaxation'
  | 'equivalent_qualification';

export interface Rule {
  criterion: CriterionType;
  params: Record<string, unknown>;
  sourceClause?: string;
  ambiguous: boolean;
  hasCorrigendum?: boolean;
}

export type EligibilityStatus = 'matched' | 'not_met' | 'missing_data' | 'manual_review';

export interface GapCoach {
  type: string;
  message?: string;
  clause?: string;
  nextCutoffDate?: string;
  data?: Record<string, unknown>;
}

export interface CriterionResult {
  criterion: CriterionType;
  status: EligibilityStatus;
  reasonCode: string;
  params: Record<string, unknown>;
  sourceClause?: string;
  gap?: GapCoach;
}

export interface EligibilityResult {
  results: CriterionResult[];
  summary: {
    matched: number;
    not_met: number;
    missing_data: number;
    manual_review: number;
  };
}

/**
 * Calculates calendar age on a specific cut-off date.
 * Deterministic handling for leap years and anniversary boundaries.
 */
export function calculateAgeOnDate(dobStr: string, cutoffStr: string): number {
  const [dobYear, dobMonth, dobDay] = dobStr.split('-').map(Number);
  const [cutYear, cutMonth, cutDay] = cutoffStr.split('-').map(Number);

  let age = cutYear - dobYear;
  if (cutMonth < dobMonth || (cutMonth === dobMonth && cutDay < dobDay)) {
    age--;
  }
  return age;
}

/**
 * Evaluates a candidate profile against an array of notice rules.
 * Strictly returns per-criterion results and count summary only.
 * NEVER returns an overall eligible boolean or verdict.
 */
export function checkEligibility(
  profile: Profile,
  rules: Rule[],
  noticeCutoffDate?: string,
): EligibilityResult {
  const results: CriterionResult[] = [];

  for (const rule of rules) {
    // Rule: Unresolved corrigendum or amendment always returns manual_review
    if (rule.hasCorrigendum) {
      results.push({
        criterion: rule.criterion,
        status: 'manual_review',
        reasonCode: 'CORRIGENDUM_PENDING',
        params: rule.params,
        sourceClause: rule.sourceClause,
      });
      continue;
    }

    // Rule: Any ambiguous clause returns manual_review. Never guess in code.
    if (rule.ambiguous) {
      results.push({
        criterion: rule.criterion,
        status: 'manual_review',
        reasonCode:
          rule.criterion === 'equivalent_qualification'
            ? 'EQUIV_CLAUSE_AMBIGUOUS'
            : 'RULE_AMBIGUOUS',
        params: rule.params,
        sourceClause: rule.sourceClause,
      });
      continue;
    }

    switch (rule.criterion) {
      case 'age': {
        if (!profile.dob || profile.dob.trim() === '') {
          results.push({
            criterion: 'age',
            status: 'missing_data',
            reasonCode: 'AGE_MISSING_DOB',
            params: rule.params,
            sourceClause: rule.sourceClause,
          });
          break;
        }

        const cutoffDate =
          (rule.params.cutoffDate as string) || noticeCutoffDate || new Date().toISOString().slice(0, 10);
        const age = calculateAgeOnDate(profile.dob, cutoffDate);
        const minAge = (rule.params.minAge as number) ?? 18;
        const maxAge = (rule.params.maxAge as number) ?? 30;
        const relaxationTable = rule.params.relaxationTable as Record<string, number> | undefined;
        const nextCutoffDate = rule.params.nextCutoffDate as string | undefined;

        if (age < minAge) {
          results.push({
            criterion: 'age',
            status: 'not_met',
            reasonCode: 'AGE_BELOW_MINIMUM',
            params: { age, minAge, maxAge, cutoffDate },
            sourceClause: rule.sourceClause,
            gap: nextCutoffDate
              ? { type: 'future_cutoff', nextCutoffDate, message: `The next cut-off date when the age limit would be satisfied is ${nextCutoffDate}.` }
              : { type: 'none', message: 'No additional guidance is available from the notice data.' },
          });
          break;
        }

        if (age <= maxAge) {
          results.push({
            criterion: 'age',
            status: 'matched',
            reasonCode: 'AGE_WITHIN_LIMIT',
            params: { age, minAge, maxAge, cutoffDate },
            sourceClause: rule.sourceClause,
          });
          break;
        }

        // Age > maxAge: check relaxation
        if (relaxationTable) {
          if (profile.category && profile.category.trim() !== '') {
            const relaxationYears = relaxationTable[profile.category] ?? 0;
            const relaxedMaxAge = maxAge + relaxationYears;

            if (age <= relaxedMaxAge) {
              results.push({
                criterion: 'age',
                status: 'matched',
                reasonCode: 'AGE_WITHIN_LIMIT',
                params: { age, minAge, maxAge, relaxedMaxAge, category: profile.category, cutoffDate },
                sourceClause: rule.sourceClause,
              });
            } else {
              results.push({
                criterion: 'age',
                status: 'not_met',
                reasonCode: 'AGE_OVER_LIMIT',
                params: { age, minAge, maxAge, relaxedMaxAge, category: profile.category, cutoffDate },
                sourceClause: rule.sourceClause,
                gap: nextCutoffDate
                  ? { type: 'future_cutoff', nextCutoffDate, message: `The next cut-off date when the age limit would be satisfied is ${nextCutoffDate}.` }
                  : { type: 'none', message: 'No additional guidance is available from the notice data.' },
              });
            }
          } else {
            // Category not entered and relaxation table exists -> missing_data
            results.push({
              criterion: 'age',
              status: 'missing_data',
              reasonCode: 'CATEGORY_NOT_ENTERED',
              params: { age, minAge, maxAge, cutoffDate },
              sourceClause: rule.sourceClause,
              gap: {
                type: 'unentered_relaxation',
                message: 'Enter your category to check if a relaxation applies.',
              },
            });
          }
        } else {
          // No relaxation table exists and age > maxAge
          results.push({
            criterion: 'age',
            status: 'not_met',
            reasonCode: 'AGE_OVER_LIMIT',
            params: { age, minAge, maxAge, cutoffDate },
            sourceClause: rule.sourceClause,
            gap: nextCutoffDate
              ? { type: 'future_cutoff', nextCutoffDate, message: `The next cut-off date when the age limit would be satisfied is ${nextCutoffDate}.` }
              : { type: 'none', message: 'No additional guidance is available from the notice data.' },
          });
        }
        break;
      }

      case 'qualification': {
        if (!profile.qualificationLevel) {
          results.push({
            criterion: 'qualification',
            status: 'missing_data',
            reasonCode: 'QUAL_MISSING',
            params: rule.params,
            sourceClause: rule.sourceClause,
          });
          break;
        }

        const requiredLevel = rule.params.requiredLevel as QualificationLevel;
        const profileRank = QUALIFICATION_ORDER[profile.qualificationLevel] ?? -1;
        const requiredRank = QUALIFICATION_ORDER[requiredLevel] ?? -1;
        const equivalentsClause = rule.params.equivalentsClause as string | undefined;

        if (profileRank >= requiredRank) {
          const requiredStream = rule.params.requiredStream as string | undefined;
          if (
            requiredStream &&
            profile.qualificationStream &&
            profile.qualificationStream.toLowerCase() !== requiredStream.toLowerCase()
          ) {
            results.push({
              criterion: 'qualification',
              status: 'not_met',
              reasonCode: 'QUAL_STREAM_MISMATCH',
              params: {
                requiredLevel,
                requiredStream,
                profileLevel: profile.qualificationLevel,
                profileStream: profile.qualificationStream,
              },
              sourceClause: rule.sourceClause,
              gap: {
                type: 'stream_mismatch',
                message: `The notice specifies stream ${requiredStream}.`,
              },
            });
          } else {
            results.push({
              criterion: 'qualification',
              status: 'matched',
              reasonCode: 'QUAL_MET',
              params: {
                requiredLevel,
                profileLevel: profile.qualificationLevel,
              },
              sourceClause: rule.sourceClause,
            });
          }
        } else {
          // Below required level
          const gap: GapCoach = equivalentsClause
            ? {
                type: 'equivalent_route',
                clause: equivalentsClause,
                message: `The notice lists a ${requiredLevel} degree. Equivalent qualifications: read clause ${equivalentsClause} of the full notice.`,
              }
            : {
                type: 'none',
                message: 'No additional guidance is available from the notice data.',
              };

          results.push({
            criterion: 'qualification',
            status: 'not_met',
            reasonCode: 'QUAL_BELOW_REQUIRED',
            params: {
              requiredLevel,
              profileLevel: profile.qualificationLevel,
              equivalentsClause,
            },
            sourceClause: rule.sourceClause,
            gap,
          });
        }
        break;
      }

      case 'category_relaxation': {
        const relaxationTable = rule.params.relaxationTable as Record<string, number> | undefined;

        if (!profile.category || profile.category.trim() === '') {
          results.push({
            criterion: 'category_relaxation',
            status: 'missing_data',
            reasonCode: 'CATEGORY_NOT_ENTERED',
            params: rule.params,
            sourceClause: rule.sourceClause,
            gap: {
              type: 'unentered_relaxation',
              message: 'Enter your category to check if a relaxation applies.',
            },
          });
          break;
        }

        const relaxationYears = relaxationTable
          ? relaxationTable[profile.category]
          : (rule.params.category === profile.category ? (rule.params.years as number) : undefined);
        if (relaxationYears && relaxationYears > 0) {
          results.push({
            criterion: 'category_relaxation',
            status: 'matched',
            reasonCode: 'CATEGORY_RELAXATION_APPLIED',
            params: {
              category: profile.category,
              relaxationYears,
            },
            sourceClause: rule.sourceClause,
          });
        } else {
          results.push({
            criterion: 'category_relaxation',
            status: 'not_met',
            reasonCode: 'CATEGORY_RELAXATION_NOT_APPLICABLE',
            params: {
              category: profile.category,
            },
            sourceClause: rule.sourceClause,
          });
        }
        break;
      }

      case 'equivalent_qualification': {
        if (rule.ambiguous) {
          results.push({
            criterion: 'equivalent_qualification',
            status: 'manual_review',
            reasonCode: 'EQUIV_CLAUSE_AMBIGUOUS',
            params: rule.params,
            sourceClause: rule.sourceClause,
          });
        } else {
          results.push({
            criterion: 'equivalent_qualification',
            status: 'matched',
            reasonCode: 'EQUIV_ACCEPTED',
            params: rule.params,
            sourceClause: rule.sourceClause,
          });
        }
        break;
      }
    }
  }

  // Summary counts only — NEVER an overall verdict
  const summary = {
    matched: 0,
    not_met: 0,
    missing_data: 0,
    manual_review: 0,
  };

  for (const r of results) {
    summary[r.status]++;
  }

  return { results, summary };
}
