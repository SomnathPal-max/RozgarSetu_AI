/**
 * RozgarSetu AI — Explanation Layer
 *
 * Rules decide eligibility. A language model NEVER decides eligibility.
 * Core eligibility works with the LLM switched off (EXPLAIN_WITH_LLM=false is default).
 * Explanations come from per-language templates keyed by result code.
 *
 * If the optional LLM layer is on, validate that its output mentions the same
 * statuses as the rule output; on mismatch fall back to the template.
 */

import { type Locale } from '@/i18n/config';
import { type CriterionResult, type EligibilityResult, type GapCoach } from '@/engine';
import enMessages from '@/i18n/messages/en.json';
import bnMessages from '@/i18n/messages/bn.json';
import hiMessages from '@/i18n/messages/hi.json';

const messagesMap: Record<Locale, typeof enMessages> = {
  en: enMessages,
  bn: bnMessages as unknown as typeof enMessages,
  hi: hiMessages as unknown as typeof enMessages,
};

/**
 * Returns deterministic template-based explanation for a reasonCode.
 */
export function getExplanation(
  reasonCode: string,
  locale: Locale = 'en',
  params: Record<string, unknown> = {}
): string {
  const dict = messagesMap[locale] || enMessages;
  const reasons = dict.reasons as Record<string, string>;
  let text = reasons[reasonCode] || reasons.RULE_AMBIGUOUS || reasonCode;

  // Replace parameter placeholders e.g. {clause}, {date}, {age}
  for (const [key, val] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
  }

  return text;
}

/**
 * Returns deterministic template-based text for Gap Coach guidance.
 * Only derived from notice data; never guesses or invents advice.
 */
export function getGapCoachText(
  gap: GapCoach | undefined,
  locale: Locale = 'en'
): string | null {
  if (!gap || gap.type === 'none') {
    return null;
  }

  const dict = messagesMap[locale] || enMessages;
  const gapDict = dict.gapCoach as Record<string, string>;

  if (gap.type === 'equivalent_route' && gap.clause) {
    if (locale === 'bn') {
      return `বিজ্ঞপ্তিতে স্নাতক ডিগ্রি তালিকাভুক্ত। সমতুল্য যোগ্যতা জানতে পূর্ণ বিজ্ঞপ্তির ধারা ${gap.clause} পড়ুন।`;
    }
    if (locale === 'hi') {
      return `सूचना में स्नातक डिग्री सूचीबद्ध है। समतुल्य योग्यताएं: पूर्ण आधिकारिक सूचना का खंड ${gap.clause} देखें।`;
    }
    return `The notice lists a graduate degree. Equivalent qualifications: read clause ${gap.clause} of the full notice.`;
  }

  if (gap.type === 'future_cutoff' && gap.nextCutoffDate) {
    return gapDict.nextCutoff.replace('{date}', gap.nextCutoffDate);
  }

  if (gap.type === 'unentered_relaxation') {
    return gapDict.enterCategory;
  }

  return gap.message || gapDict.noAdvice;
}

export interface ExplainedCriterionResult extends CriterionResult {
  explanation: string;
  gapText: string | null;
}

export interface ExplainedEligibilityResult {
  results: ExplainedCriterionResult[];
  summary: EligibilityResult['summary'];
  isLLMRewritten: boolean;
}

/**
 * Generates explanations for an EligibilityResult.
 * Falls back to templates if LLM flag is false or validation fails.
 */
export async function explainResults(
  result: EligibilityResult,
  locale: Locale = 'en'
): Promise<ExplainedEligibilityResult> {
  const isLLMEnabled = process.env.EXPLAIN_WITH_LLM === 'true';

  // 1. Generate baseline deterministic template explanations
  const templateResults: ExplainedCriterionResult[] = result.results.map((r) => ({
    ...r,
    explanation: getExplanation(r.reasonCode, locale, r.params),
    gapText: getGapCoachText(r.gap, locale),
  }));

  // If LLM is disabled, return deterministic template explanations immediately
  if (!isLLMEnabled) {
    return {
      results: templateResults,
      summary: result.summary,
      isLLMRewritten: false,
    };
  }

  // 2. Optional LLM rewrite behind EXPLAIN_WITH_LLM flag
  try {
    const { rewriteWithLLM } = await import('./llm');
    const rewritten = await rewriteWithLLM(templateResults, locale);

    // Validate that LLM output matches the exact rule statuses
    const isValid = rewritten.every(
      (rw, idx) => rw.status === result.results[idx].status && rw.criterion === result.results[idx].criterion
    );

    if (isValid) {
      return {
        results: rewritten,
        summary: result.summary,
        isLLMRewritten: true,
      };
    } else {
      console.warn('⚠️ LLM rewrite failed status validation. Falling back to deterministic templates.');
      return {
        results: templateResults,
        summary: result.summary,
        isLLMRewritten: false,
      };
    }
  } catch (err) {
    console.error('LLM rewrite failed with error, falling back to templates:', err);
    return {
      results: templateResults,
      summary: result.summary,
      isLLMRewritten: false,
    };
  }
}
