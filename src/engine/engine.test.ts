import { describe, it, expect } from 'vitest';
import {
  checkEligibility,
  type Profile,
  type Rule,
  type EligibilityResult,
  QUALIFICATION_ORDER,
} from '@/engine/index';

describe('Rules Engine — Smoke Tests', () => {
  it('should return an EligibilityResult with empty results for empty rules', () => {
    const profile: Profile = { dob: '2002-05-15', qualificationLevel: 'graduate' };
    const rules: Rule[] = [];
    const result = checkEligibility(profile, rules);

    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('summary');
    expect(result.results).toEqual([]);
    expect(result.summary).toEqual({
      matched: 0,
      not_met: 0,
      missing_data: 0,
      manual_review: 0,
    });
  });

  it('should never return an overall eligible boolean', () => {
    const profile: Profile = { dob: '2002-05-15', qualificationLevel: 'graduate' };
    const rules: Rule[] = [];
    const result: EligibilityResult = checkEligibility(profile, rules);

    // The result must NOT have an 'eligible' or 'isEligible' property
    expect(result).not.toHaveProperty('eligible');
    expect(result).not.toHaveProperty('isEligible');
    expect(result).not.toHaveProperty('verdict');
  });

  it('should define correct qualification ordering', () => {
    expect(QUALIFICATION_ORDER.below_secondary).toBeLessThan(QUALIFICATION_ORDER.secondary);
    expect(QUALIFICATION_ORDER.secondary).toBeLessThan(QUALIFICATION_ORDER.higher_secondary);
    expect(QUALIFICATION_ORDER.higher_secondary).toBeLessThan(QUALIFICATION_ORDER.diploma_iti);
    expect(QUALIFICATION_ORDER.diploma_iti).toBeLessThan(QUALIFICATION_ORDER.graduate);
    expect(QUALIFICATION_ORDER.graduate).toBeLessThan(QUALIFICATION_ORDER.postgraduate);
  });
});
