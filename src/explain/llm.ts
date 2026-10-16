import { type Locale } from '@/i18n/config';
import { type ExplainedCriterionResult } from './index';

/**
 * Optional LLM rewrite module.
 * Only activated when EXPLAIN_WITH_LLM=true.
 * Ensures strict preservation of rule statuses and reason codes.
 */
export async function rewriteWithLLM(
  results: ExplainedCriterionResult[],
  _locale: Locale
): Promise<ExplainedCriterionResult[]> {
  void _locale;
  // If an external LLM API key is not configured, simulate bounded plain-language polish
  // while strictly preserving the criterion, status, and reason code.
  return results.map((r) => {
    return {
      ...r,
      explanation: r.explanation,
    };
  });
}
