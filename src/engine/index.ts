/**
 * RozgarSetu AI — Pure Eligibility Rules Engine
 *
 * This module has ZERO database or network access.
 * It is a pure function: (Profile, Rule[]) => EligibilityResult
 *
 * Rules decide eligibility. A language model NEVER decides eligibility.
 * Core eligibility must work with the LLM switched off.
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
  category?: string; // e.g. 'SC', 'ST', 'OBC' — optional per AGENTS.md rule 9
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
 * Check eligibility for a profile against a set of rules.
 * NEVER returns an overall eligible/not eligible verdict.
 * Returns per-criterion results and a count summary only.
 */
export function checkEligibility(
  _profile: Profile,
  _rules: Rule[],
  _cutoffDate?: string,
): EligibilityResult {
  // Stub — full implementation in Phase 1
  return {
    results: [],
    summary: { matched: 0, not_met: 0, missing_data: 0, manual_review: 0 },
  };
}
