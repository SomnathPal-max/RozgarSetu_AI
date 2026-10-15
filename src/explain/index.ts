/**
 * Explanation templates keyed by reasonCode, per language.
 * Default layer — works with EXPLAIN_WITH_LLM=false.
 */

export type ReasonCode = string;
export type TemplateMap = Record<ReasonCode, string>;

// Templates are loaded from locale files (en.json reasons/gapCoach sections).
// This module re-exports the template lookup logic.

export function getExplanation(
  reasonCode: string,
  locale: string,
  params: Record<string, unknown> = {},
): string {
  // In production this reads from the locale's reasons map.
  // Stub for Phase 0 — full implementation in Phase 3.
  void locale;
  void params;
  return reasonCode;
}

export function getGapCoachText(
  type: string,
  locale: string,
  params: Record<string, unknown> = {},
): string {
  void locale;
  void params;
  return type;
}
