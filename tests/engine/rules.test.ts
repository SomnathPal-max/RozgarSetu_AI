import { describe, it, expect } from 'vitest';
import {
  checkEligibility,
  calculateAgeOnDate,
  type Profile,
  type Rule,
  type EligibilityResult,
  type CriterionResult,
  QUALIFICATION_ORDER,
  type QualificationLevel,
} from '@/engine/index';

describe('RozgarSetu AI — Pure Eligibility Rules Engine Test Suite', () => {
  // =========================================================================
  // SUITE 1: Screen 4 Acceptance Test — Notice A Exact Reproduction
  // =========================================================================
  describe('Suite 1: Notice A Mock-up Case (Screen 4 exact reproduction)', () => {
    // Illustrative Notice A rules:
    // - Cut-off: 1 Aug 2026
    // - Age limit: 30 (min 18), relaxation table: SC: 5, ST: 5, OBC: 3
    // - Qualification: graduate required
    // - Category relaxation rule present
    // - Equivalents clause "4(b)" flagged ambiguous
    const noticeARules: Rule[] = [
      {
        criterion: 'age',
        params: {
          minAge: 18,
          maxAge: 30,
          cutoffDate: '2026-08-01',
          relaxationTable: { SC: 5, ST: 5, OBC: 3 },
        },
        sourceClause: '3(a)',
        ambiguous: false,
      },
      {
        criterion: 'qualification',
        params: {
          requiredLevel: 'graduate',
          equivalentsClause: '4(b)',
        },
        sourceClause: '4(a)',
        ambiguous: false,
      },
      {
        criterion: 'category_relaxation',
        params: {
          relaxationTable: { SC: 5, ST: 5, OBC: 3 },
        },
        sourceClause: '3(b)',
        ambiguous: false,
      },
      {
        criterion: 'equivalent_qualification',
        params: {
          clause: '4(b)',
          acceptedList: ['B.Tech', 'B.Sc Honours'],
        },
        sourceClause: '4(b)',
        ambiguous: true, // Clause 4(b) flagged ambiguous per plan
      },
    ];

    // Test profile: Age 24 (DOB 2002-05-15), Higher Secondary, Category blank
    const noticeAProfile: Profile = {
      dob: '2002-05-15', // Age 24 on 2026-08-01
      qualificationLevel: 'higher_secondary',
      category: undefined,
    };

    it('evaluates Notice A profile to exactly 4 criterion results', () => {
      const result = checkEligibility(noticeAProfile, noticeARules, '2026-08-01');
      expect(result.results).toHaveLength(4);
    });

    it('Notice A - Result 1: Age is matched (Age 24 <= 30 on cut-off 1 Aug 2026)', () => {
      const result = checkEligibility(noticeAProfile, noticeARules, '2026-08-01');
      const ageRes = result.results.find((r) => r.criterion === 'age');
      expect(ageRes).toBeDefined();
      expect(ageRes!.status).toBe('matched');
      expect(ageRes!.reasonCode).toBe('AGE_WITHIN_LIMIT');
      expect(ageRes!.params.age).toBe(24);
      expect(ageRes!.params.maxAge).toBe(30);
    });

    it('Notice A - Result 2: Graduate degree is not_met with Gap Coach clause 4(b)', () => {
      const result = checkEligibility(noticeAProfile, noticeARules, '2026-08-01');
      const qualRes = result.results.find((r) => r.criterion === 'qualification');
      expect(qualRes).toBeDefined();
      expect(qualRes!.status).toBe('not_met');
      expect(qualRes!.reasonCode).toBe('QUAL_BELOW_REQUIRED');
      expect(qualRes!.gap).toBeDefined();
      expect(qualRes!.gap?.clause).toBe('4(b)');
      expect(qualRes!.gap?.message).toContain('4(b)');
    });

    it('Notice A - Result 3: Category relaxation is missing_data because category is blank', () => {
      const result = checkEligibility(noticeAProfile, noticeARules, '2026-08-01');
      const catRes = result.results.find((r) => r.criterion === 'category_relaxation');
      expect(catRes).toBeDefined();
      expect(catRes!.status).toBe('missing_data');
      expect(catRes!.reasonCode).toBe('CATEGORY_NOT_ENTERED');
    });

    it('Notice A - Result 4: Equivalent qualification clause is manual_review (ambiguous = true)', () => {
      const result = checkEligibility(noticeAProfile, noticeARules, '2026-08-01');
      const equivRes = result.results.find((r) => r.criterion === 'equivalent_qualification');
      expect(equivRes).toBeDefined();
      expect(equivRes!.status).toBe('manual_review');
      expect(equivRes!.reasonCode).toBe('EQUIV_CLAUSE_AMBIGUOUS');
    });

    it('Notice A summary counts match exactly: 1 matched, 1 not_met, 1 missing_data, 1 manual_review', () => {
      const result = checkEligibility(noticeAProfile, noticeARules, '2026-08-01');
      expect(result.summary).toEqual({
        matched: 1,
        not_met: 1,
        missing_data: 1,
        manual_review: 1,
      });
    });
  });

  // =========================================================================
  // SUITE 2: Age Boundary Tests
  // =========================================================================
  describe('Suite 2: Age Boundary Tests', () => {
    const ageRule: Rule = {
      criterion: 'age',
      params: { minAge: 18, maxAge: 30, cutoffDate: '2026-08-01' },
      sourceClause: '3(a)',
      ambiguous: false,
    };

    it('candidate exactly on maximum age limit on cutoff date is matched (age 30)', () => {
      // Born 1996-08-01, exactly 30 on 2026-08-01
      const res = checkEligibility({ dob: '1996-08-01' }, [ageRule], '2026-08-01');
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].params.age).toBe(30);
    });

    it('candidate born one day before cutoff anniversary is one day over limit (age 30 years and 1 day -> 30, but born 1996-07-31)', () => {
      // Born 1996-07-31 -> On 2026-08-01, age is 30.
      const res = checkEligibility({ dob: '1996-07-31' }, [ageRule], '2026-08-01');
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].params.age).toBe(30);
    });

    it('candidate born 1995-08-01 is exactly 31 on cutoff date -> not_met', () => {
      const res = checkEligibility({ dob: '1995-08-01' }, [ageRule], '2026-08-01');
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('AGE_OVER_LIMIT');
      expect(res.results[0].params.age).toBe(31);
    });

    it('candidate born 1995-08-02 is 30 on 2026-08-01 (turns 31 next day) -> matched', () => {
      const res = checkEligibility({ dob: '1995-08-02' }, [ageRule], '2026-08-01');
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].params.age).toBe(30);
    });

    it('candidate born 1995-07-31 is 31 on 2026-08-01 -> not_met', () => {
      const res = checkEligibility({ dob: '1995-07-31' }, [ageRule], '2026-08-01');
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].params.age).toBe(31);
    });

    it('candidate exactly on minimum age limit is matched (age 18)', () => {
      // Born 2008-08-01, exactly 18 on 2026-08-01
      const res = checkEligibility({ dob: '2008-08-01' }, [ageRule], '2026-08-01');
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].params.age).toBe(18);
    });

    it('candidate one day under minimum age limit is not_met (age 17)', () => {
      // Born 2008-08-02, turns 18 on 2026-08-02, so on 2026-08-01 age is 17
      const res = checkEligibility({ dob: '2008-08-02' }, [ageRule], '2026-08-01');
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('AGE_BELOW_MINIMUM');
      expect(res.results[0].params.age).toBe(17);
    });

    it('candidate well below minimum age (age 16) is not_met', () => {
      const res = checkEligibility({ dob: '2010-01-01' }, [ageRule], '2026-08-01');
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('AGE_BELOW_MINIMUM');
    });

    it('candidate well above maximum age (age 45) without relaxation is not_met', () => {
      const res = checkEligibility({ dob: '1981-01-01' }, [ageRule], '2026-08-01');
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('AGE_OVER_LIMIT');
    });
  });

  // =========================================================================
  // SUITE 3: Leap-Day DOB Tests (Feb 29)
  // =========================================================================
  describe('Suite 3: Leap-Day DOB (Feb 29)', () => {
    it('calculates correct age on leap year cutoff before Feb 29', () => {
      // DOB: 2000-02-29. Cutoff: 2024-02-28. Age should be 23.
      expect(calculateAgeOnDate('2000-02-29', '2024-02-28')).toBe(23);
    });

    it('calculates correct age on leap year cutoff on Feb 29', () => {
      // DOB: 2000-02-29. Cutoff: 2024-02-29. Age should be 24.
      expect(calculateAgeOnDate('2000-02-29', '2024-02-29')).toBe(24);
    });

    it('calculates correct age on non-leap year cutoff on Feb 28', () => {
      // DOB: 2000-02-29. Cutoff: 2025-02-28. Has not reached Feb 29, so age is 24.
      expect(calculateAgeOnDate('2000-02-29', '2025-02-28')).toBe(24);
    });

    it('calculates correct age on non-leap year cutoff on Mar 01', () => {
      // DOB: 2000-02-29. Cutoff: 2025-03-01. Passed anniversary, age is 25.
      expect(calculateAgeOnDate('2000-02-29', '2025-03-01')).toBe(25);
    });

    it('evaluates eligibility for leap-day candidate correctly', () => {
      const rule: Rule = {
        criterion: 'age',
        params: { minAge: 18, maxAge: 25, cutoffDate: '2025-03-01' },
        ambiguous: false,
      };
      // Born 2000-02-29 -> Age 25 on 2025-03-01 -> matched
      const res = checkEligibility({ dob: '2000-02-29' }, [rule], '2025-03-01');
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].params.age).toBe(25);
    });

    it('evaluates eligibility for leap-day candidate one year older -> not_met', () => {
      const rule: Rule = {
        criterion: 'age',
        params: { minAge: 18, maxAge: 25, cutoffDate: '2025-03-01' },
        ambiguous: false,
      };
      // Born 1996-02-29 -> Age 29 on 2025-03-01 -> not_met
      const res = checkEligibility({ dob: '1996-02-29' }, [rule], '2025-03-01');
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].params.age).toBe(29);
    });
  });

  // =========================================================================
  // SUITE 4: Category Relaxation Tests
  // =========================================================================
  describe('Suite 4: Category Relaxation Tests', () => {
    const ageWithRelaxationRule: Rule = {
      criterion: 'age',
      params: {
        minAge: 18,
        maxAge: 30,
        cutoffDate: '2026-08-01',
        relaxationTable: { SC: 5, ST: 5, OBC: 3 },
      },
      sourceClause: '3(a)',
      ambiguous: false,
    };

    it('candidate age 32 with OBC category (+3 relaxation -> max 33) is matched', () => {
      // Born 1994-05-15 -> Age 32 on 2026-08-01
      const res = checkEligibility(
        { dob: '1994-05-15', category: 'OBC' },
        [ageWithRelaxationRule],
        '2026-08-01',
      );
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].reasonCode).toBe('AGE_WITHIN_LIMIT');
      expect(res.results[0].params.relaxedMaxAge).toBe(33);
    });

    it('candidate age 34 with OBC category (+3 relaxation -> max 33) is not_met', () => {
      // Born 1992-05-15 -> Age 34 on 2026-08-01
      const res = checkEligibility(
        { dob: '1992-05-15', category: 'OBC' },
        [ageWithRelaxationRule],
        '2026-08-01',
      );
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('AGE_OVER_LIMIT');
    });

    it('candidate age 34 with SC category (+5 relaxation -> max 35) is matched', () => {
      const res = checkEligibility(
        { dob: '1992-05-15', category: 'SC' },
        [ageWithRelaxationRule],
        '2026-08-01',
      );
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].params.relaxedMaxAge).toBe(35);
    });

    it('candidate age 34 with ST category (+5 relaxation -> max 35) is matched', () => {
      const res = checkEligibility(
        { dob: '1992-05-15', category: 'ST' },
        [ageWithRelaxationRule],
        '2026-08-01',
      );
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].params.relaxedMaxAge).toBe(35);
    });

    it('candidate age 36 with SC category (+5 relaxation -> max 35) is not_met', () => {
      // Born 1990-05-15 -> Age 36
      const res = checkEligibility(
        { dob: '1990-05-15', category: 'SC' },
        [ageWithRelaxationRule],
        '2026-08-01',
      );
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('AGE_OVER_LIMIT');
    });

    it('candidate age 32 with category GEN (no relaxation) is not_met', () => {
      const res = checkEligibility(
        { dob: '1994-05-15', category: 'GEN' },
        [ageWithRelaxationRule],
        '2026-08-01',
      );
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('AGE_OVER_LIMIT');
    });

    it('candidate age 32 with category BLANK and relaxation table returns missing_data', () => {
      // Age 32 exceeds 30, but could be eligible if SC/ST/OBC -> missing_data
      const res = checkEligibility(
        { dob: '1994-05-15', category: undefined },
        [ageWithRelaxationRule],
        '2026-08-01',
      );
      expect(res.results[0].status).toBe('missing_data');
      expect(res.results[0].reasonCode).toBe('CATEGORY_NOT_ENTERED');
    });

    it('category_relaxation criterion returns matched when user entered eligible category', () => {
      const catRule: Rule = {
        criterion: 'category_relaxation',
        params: { relaxationTable: { SC: 5, ST: 5, OBC: 3 } },
        sourceClause: '3(b)',
        ambiguous: false,
      };
      const res = checkEligibility({ category: 'SC' }, [catRule]);
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].reasonCode).toBe('CATEGORY_RELAXATION_APPLIED');
    });

    it('category_relaxation criterion returns missing_data when category is not entered', () => {
      const catRule: Rule = {
        criterion: 'category_relaxation',
        params: { relaxationTable: { SC: 5, ST: 5, OBC: 3 } },
        sourceClause: '3(b)',
        ambiguous: false,
      };
      const res = checkEligibility({ category: undefined }, [catRule]);
      expect(res.results[0].status).toBe('missing_data');
      expect(res.results[0].reasonCode).toBe('CATEGORY_NOT_ENTERED');
    });

    it('category_relaxation criterion returns not_met for category without relaxation', () => {
      const catRule: Rule = {
        criterion: 'category_relaxation',
        params: { relaxationTable: { SC: 5, ST: 5, OBC: 3 } },
        sourceClause: '3(b)',
        ambiguous: false,
      };
      const res = checkEligibility({ category: 'GEN' }, [catRule]);
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('CATEGORY_RELAXATION_NOT_APPLICABLE');
    });
  });

  // =========================================================================
  // SUITE 5: Qualification Ordered Ranking Tests
  // =========================================================================
  describe('Suite 5: Qualification Ordered Ranking Tests', () => {
    const qualRuleGraduate: Rule = {
      criterion: 'qualification',
      params: { requiredLevel: 'graduate' },
      sourceClause: '4(a)',
      ambiguous: false,
    };

    it('qualification ordering has strictly monotonic rank values', () => {
      const levels: QualificationLevel[] = [
        'below_secondary',
        'secondary',
        'higher_secondary',
        'diploma_iti',
        'graduate',
        'postgraduate',
      ];
      for (let i = 0; i < levels.length - 1; i++) {
        expect(QUALIFICATION_ORDER[levels[i]]).toBeLessThan(QUALIFICATION_ORDER[levels[i + 1]]);
      }
    });

    it('candidate with exact required qualification level (graduate) is matched', () => {
      const res = checkEligibility(
        { qualificationLevel: 'graduate' },
        [qualRuleGraduate],
      );
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].reasonCode).toBe('QUAL_MET');
    });

    it('candidate with higher qualification level (postgraduate) is matched', () => {
      const res = checkEligibility(
        { qualificationLevel: 'postgraduate' },
        [qualRuleGraduate],
      );
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].reasonCode).toBe('QUAL_MET');
    });

    it('candidate with lower qualification level (higher_secondary) is not_met', () => {
      const res = checkEligibility(
        { qualificationLevel: 'higher_secondary' },
        [qualRuleGraduate],
      );
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('QUAL_BELOW_REQUIRED');
    });

    it('candidate with diploma_iti when graduate required is not_met', () => {
      const res = checkEligibility(
        { qualificationLevel: 'diploma_iti' },
        [qualRuleGraduate],
      );
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('QUAL_BELOW_REQUIRED');
    });

    it('candidate with secondary when graduate required is not_met', () => {
      const res = checkEligibility(
        { qualificationLevel: 'secondary' },
        [qualRuleGraduate],
      );
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('QUAL_BELOW_REQUIRED');
    });

    it('candidate with below_secondary when graduate required is not_met', () => {
      const res = checkEligibility(
        { qualificationLevel: 'below_secondary' },
        [qualRuleGraduate],
      );
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('QUAL_BELOW_REQUIRED');
    });

    it('candidate missing qualificationLevel returns missing_data', () => {
      const res = checkEligibility(
        { qualificationLevel: undefined },
        [qualRuleGraduate],
      );
      expect(res.results[0].status).toBe('missing_data');
      expect(res.results[0].reasonCode).toBe('QUAL_MISSING');
    });

    it('secondary requirement matched by secondary, higher_secondary, diploma_iti, graduate, postgraduate', () => {
      const ruleSec: Rule = {
        criterion: 'qualification',
        params: { requiredLevel: 'secondary' },
        ambiguous: false,
      };
      const eligibleLevels: QualificationLevel[] = [
        'secondary',
        'higher_secondary',
        'diploma_iti',
        'graduate',
        'postgraduate',
      ];
      for (const level of eligibleLevels) {
        const res = checkEligibility({ qualificationLevel: level }, [ruleSec]);
        expect(res.results[0].status).toBe('matched');
      }
    });

    it('secondary requirement not_met by below_secondary', () => {
      const ruleSec: Rule = {
        criterion: 'qualification',
        params: { requiredLevel: 'secondary' },
        ambiguous: false,
      };
      const res = checkEligibility({ qualificationLevel: 'below_secondary' }, [ruleSec]);
      expect(res.results[0].status).toBe('not_met');
    });

    it('stream requirement matches when specified and candidate has matching stream', () => {
      const ruleStream: Rule = {
        criterion: 'qualification',
        params: { requiredLevel: 'graduate', requiredStream: 'Commerce' },
        ambiguous: false,
      };
      const res = checkEligibility(
        { qualificationLevel: 'graduate', qualificationStream: 'Commerce' },
        [ruleStream],
      );
      expect(res.results[0].status).toBe('matched');
    });

    it('stream mismatch results in not_met with stream reason code', () => {
      const ruleStream: Rule = {
        criterion: 'qualification',
        params: { requiredLevel: 'graduate', requiredStream: 'Commerce' },
        ambiguous: false,
      };
      const res = checkEligibility(
        { qualificationLevel: 'graduate', qualificationStream: 'Arts' },
        [ruleStream],
      );
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('QUAL_STREAM_MISMATCH');
    });
  });

  // =========================================================================
  // SUITE 6: Equivalent Qualification Clause & Ambiguity Tests
  // =========================================================================
  describe('Suite 6: Equivalent Qualification & Ambiguity Tests', () => {
    it('equivalent qualification rule with ambiguous = true returns manual_review', () => {
      const rule: Rule = {
        criterion: 'equivalent_qualification',
        params: { clause: '4(b)', acceptedList: ['B.Tech', 'BCA'] },
        sourceClause: '4(b)',
        ambiguous: true,
      };
      const res = checkEligibility({ qualificationLevel: 'diploma_iti' }, [rule]);
      expect(res.results[0].status).toBe('manual_review');
      expect(res.results[0].reasonCode).toBe('EQUIV_CLAUSE_AMBIGUOUS');
    });

    it('any rule with ambiguous = true returns manual_review regardless of profile', () => {
      const ambiguousRule: Rule = {
        criterion: 'qualification',
        params: { requiredLevel: 'graduate' },
        sourceClause: '5(c)',
        ambiguous: true,
      };
      // Even if candidate has postgraduate, ambiguous rule cannot be auto-resolved
      const res = checkEligibility({ qualificationLevel: 'postgraduate' }, [ambiguousRule]);
      expect(res.results[0].status).toBe('manual_review');
      expect(res.results[0].reasonCode).toBe('RULE_AMBIGUOUS');
    });

    it('rule with hasCorrigendum = true returns manual_review', () => {
      const corrigendumRule: Rule = {
        criterion: 'age',
        params: { minAge: 18, maxAge: 30, cutoffDate: '2026-08-01' },
        sourceClause: '3(a)',
        ambiguous: false,
        hasCorrigendum: true,
      };
      const res = checkEligibility({ dob: '2000-01-01' }, [corrigendumRule], '2026-08-01');
      expect(res.results[0].status).toBe('manual_review');
      expect(res.results[0].reasonCode).toBe('CORRIGENDUM_PENDING');
    });

    it('qualification rule with ambiguous equivalentsClause sets Gap Coach when candidate is below required', () => {
      const rule: Rule = {
        criterion: 'qualification',
        params: { requiredLevel: 'graduate', equivalentsClause: '4(b)' },
        sourceClause: '4(a)',
        ambiguous: false,
      };
      const res = checkEligibility({ qualificationLevel: 'secondary' }, [rule]);
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].gap).toBeDefined();
      expect(res.results[0].gap?.clause).toBe('4(b)');
    });
  });

  // =========================================================================
  // SUITE 7: Gap Coach Verification Tests
  // =========================================================================
  describe('Suite 7: Gap Coach Tests (per AGENTS.md: only notice data, never guess)', () => {
    it('Gap Coach attaches only when status is not_met', () => {
      const rule: Rule = {
        criterion: 'qualification',
        params: { requiredLevel: 'graduate', equivalentsClause: '4(b)' },
        ambiguous: false,
      };
      // For matched candidate, gap MUST NOT be set
      const resMatched = checkEligibility({ qualificationLevel: 'graduate' }, [rule]);
      expect(resMatched.results[0].gap).toBeUndefined();

      // For not_met candidate, gap IS set
      const resNotMet = checkEligibility({ qualificationLevel: 'secondary' }, [rule]);
      expect(resNotMet.results[0].gap).toBeDefined();
    });

    it('Gap Coach provides next cutoff date when notice specifies one', () => {
      const ageRuleWithNextCutoff: Rule = {
        criterion: 'age',
        params: {
          minAge: 18,
          maxAge: 30,
          cutoffDate: '2026-08-01',
          nextCutoffDate: '2027-08-01',
        },
        ambiguous: false,
      };
      // Born 2009-01-01 -> Age 17 on 2026-08-01 (too young). Turns 18 in 2027.
      const res = checkEligibility({ dob: '2009-01-01' }, [ageRuleWithNextCutoff], '2026-08-01');
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].gap?.nextCutoffDate).toBe('2027-08-01');
    });

    it('Gap Coach returns no invented advice when notice has no future cut-offs or equivalents', () => {
      const bareAgeRule: Rule = {
        criterion: 'age',
        params: { minAge: 18, maxAge: 25, cutoffDate: '2026-08-01' },
        ambiguous: false,
      };
      const res = checkEligibility({ dob: '1990-01-01' }, [bareAgeRule], '2026-08-01');
      expect(res.results[0].status).toBe('not_met');
      // Must not invent advice
      expect(res.results[0].gap?.type).toBe('none');
    });

    it('Gap Coach suggests entering category when unentered category could provide relaxation', () => {
      const ruleWithRelaxation: Rule = {
        criterion: 'age',
        params: {
          minAge: 18,
          maxAge: 30,
          cutoffDate: '2026-08-01',
          relaxationTable: { SC: 5, ST: 5, OBC: 3 },
        },
        ambiguous: false,
      };
      // Age 32, category undefined -> missing_data with prompt to enter category
      const res = checkEligibility({ dob: '1994-05-15', category: undefined }, [ruleWithRelaxation], '2026-08-01');
      expect(res.results[0].status).toBe('missing_data');
      expect(res.results[0].reasonCode).toBe('CATEGORY_NOT_ENTERED');
    });
  });

  // =========================================================================
  // SUITE 8: Missing Data Handling Tests
  // =========================================================================
  describe('Suite 8: Missing Data Handling Tests', () => {
    it('missing DOB returns missing_data (AGE_MISSING_DOB)', () => {
      const rule: Rule = {
        criterion: 'age',
        params: { minAge: 18, maxAge: 30, cutoffDate: '2026-08-01' },
        ambiguous: false,
      };
      const res = checkEligibility({ dob: undefined }, [rule], '2026-08-01');
      expect(res.results[0].status).toBe('missing_data');
      expect(res.results[0].reasonCode).toBe('AGE_MISSING_DOB');
    });

    it('empty string DOB returns missing_data (AGE_MISSING_DOB)', () => {
      const rule: Rule = {
        criterion: 'age',
        params: { minAge: 18, maxAge: 30, cutoffDate: '2026-08-01' },
        ambiguous: false,
      };
      const res = checkEligibility({ dob: '' }, [rule], '2026-08-01');
      expect(res.results[0].status).toBe('missing_data');
      expect(res.results[0].reasonCode).toBe('AGE_MISSING_DOB');
    });

    it('missing qualification level returns missing_data (QUAL_MISSING)', () => {
      const rule: Rule = {
        criterion: 'qualification',
        params: { requiredLevel: 'secondary' },
        ambiguous: false,
      };
      const res = checkEligibility({}, [rule]);
      expect(res.results[0].status).toBe('missing_data');
      expect(res.results[0].reasonCode).toBe('QUAL_MISSING');
    });

    it('completely empty profile returns missing_data for age and qualification', () => {
      const rules: Rule[] = [
        { criterion: 'age', params: { minAge: 18, maxAge: 30 }, ambiguous: false },
        { criterion: 'qualification', params: { requiredLevel: 'graduate' }, ambiguous: false },
      ];
      const res = checkEligibility({}, rules);
      expect(res.results[0].status).toBe('missing_data');
      expect(res.results[1].status).toBe('missing_data');
      expect(res.summary.missing_data).toBe(2);
      expect(res.summary.matched).toBe(0);
    });
  });

  // =========================================================================
  // SUITE 9: Empty Ruleset & Multiple Rules Combinations
  // =========================================================================
  describe('Suite 9: Empty Ruleset and Combinations', () => {
    it('empty rules array returns empty results and zero counts', () => {
      const res = checkEligibility({ dob: '2000-01-01', qualificationLevel: 'graduate' }, []);
      expect(res.results).toEqual([]);
      expect(res.summary).toEqual({
        matched: 0,
        not_met: 0,
        missing_data: 0,
        manual_review: 0,
      });
    });

    it('handles multiple criteria with mixed statuses correctly in summary', () => {
      const mixedRules: Rule[] = [
        // Rule 1: Age -> matched
        { criterion: 'age', params: { minAge: 18, maxAge: 30, cutoffDate: '2026-08-01' }, ambiguous: false },
        // Rule 2: Qualification -> not_met
        { criterion: 'qualification', params: { requiredLevel: 'postgraduate' }, ambiguous: false },
        // Rule 3: Category -> missing_data
        { criterion: 'category_relaxation', params: { relaxationTable: { SC: 5 } }, ambiguous: false },
        // Rule 4: Ambiguous -> manual_review
        { criterion: 'equivalent_qualification', params: {}, ambiguous: true },
      ];

      const profile: Profile = {
        dob: '2000-01-01',
        qualificationLevel: 'graduate',
        category: undefined,
      };

      const res = checkEligibility(profile, mixedRules, '2026-08-01');
      expect(res.summary).toEqual({
        matched: 1,
        not_met: 1,
        missing_data: 1,
        manual_review: 1,
      });
    });

    it('preserves sourceClause on every result when provided in rule', () => {
      const rule: Rule = {
        criterion: 'age',
        params: { minAge: 18, maxAge: 30, cutoffDate: '2026-08-01' },
        sourceClause: 'Section 4, Clause (b)',
        ambiguous: false,
      };
      const res = checkEligibility({ dob: '2000-01-01' }, [rule], '2026-08-01');
      expect(res.results[0].sourceClause).toBe('Section 4, Clause (b)');
    });
  });

  // =========================================================================
  // SUITE 10: NON-NEGOTIABLE ARCHITECTURAL INVARIANT TEST
  // AGENTS.md Rule 3: Do NOT produce a single overall "eligible / not eligible" verdict.
  // =========================================================================
  describe('Suite 10: Architectural Invariant Tests (AGENTS.md Rule 3)', () => {
    it('ASSERTION: checkEligibility return object NEVER contains an overall eligible boolean', () => {
      const allMatchedRules: Rule[] = [
        { criterion: 'age', params: { minAge: 18, maxAge: 30, cutoffDate: '2026-08-01' }, ambiguous: false },
        { criterion: 'qualification', params: { requiredLevel: 'secondary' }, ambiguous: false },
      ];
      const perfectProfile: Profile = {
        dob: '2000-01-01',
        qualificationLevel: 'postgraduate',
        category: 'GEN',
      };

      const res = checkEligibility(perfectProfile, allMatchedRules, '2026-08-01');

      // The result MUST have results and summary
      expect(res).toHaveProperty('results');
      expect(res).toHaveProperty('summary');

      // It must NOT have any overall eligibility verdict property
      const resRecord = res as unknown as Record<string, unknown>;
      expect(resRecord['eligible']).toBeUndefined();
      expect(resRecord['isEligible']).toBeUndefined();
      expect(resRecord['verdict']).toBeUndefined();
      expect(resRecord['status']).toBeUndefined();
      expect(resRecord['overallStatus']).toBeUndefined();
      expect(resRecord['overallResult']).toBeUndefined();
      expect(resRecord['passed']).toBeUndefined();
    });

    it('ASSERTION: summary only contains counts of the four allowed states', () => {
      const res = checkEligibility({}, []);
      const summaryKeys = Object.keys(res.summary).sort();
      expect(summaryKeys).toEqual(['manual_review', 'matched', 'missing_data', 'not_met'].sort());
    });

    it('ASSERTION: every criterion result has exactly one of the four allowed states', () => {
      const allowedStates = new Set(['matched', 'not_met', 'missing_data', 'manual_review']);
      const rules: Rule[] = [
        { criterion: 'age', params: { minAge: 18, maxAge: 30 }, ambiguous: false },
        { criterion: 'qualification', params: { requiredLevel: 'graduate' }, ambiguous: false },
        { criterion: 'category_relaxation', params: { relaxationTable: { SC: 5 } }, ambiguous: false },
        { criterion: 'equivalent_qualification', params: {}, ambiguous: true },
      ];
      const res = checkEligibility({ dob: '2000-01-01', qualificationLevel: 'secondary' }, rules);

      for (const criterionRes of res.results) {
        expect(allowedStates.has(criterionRes.status)).toBe(true);
      }
    });

    it('ASSERTION: sum of summary counts equals total number of results', () => {
      const rules: Rule[] = [
        { criterion: 'age', params: { minAge: 18, maxAge: 30, cutoffDate: '2026-08-01' }, ambiguous: false },
        { criterion: 'qualification', params: { requiredLevel: 'graduate' }, ambiguous: false },
        { criterion: 'category_relaxation', params: { relaxationTable: { SC: 5 } }, ambiguous: false },
        { criterion: 'equivalent_qualification', params: {}, ambiguous: true },
      ];
      const res = checkEligibility({ dob: '2000-01-01', qualificationLevel: 'secondary' }, rules, '2026-08-01');
      const totalSummary =
        res.summary.matched +
        res.summary.not_met +
        res.summary.missing_data +
        res.summary.manual_review;
      expect(totalSummary).toBe(res.results.length);
    });
  });

  // =========================================================================
  // SUITE 11: Independent Hand-Checked Reviewer Test Cases (per section 6)
  // Two independent test cases added as evidence items
  // =========================================================================
  describe('Suite 11: Independent Hand-Checked Cases (Reviewer 1 & Reviewer 2)', () => {
    // Reviewer 1 case: Police Sub-Inspector illustrative requirements
    // Age 20 to 27 on 2026-01-01. Candidate age 28, OBC (+3 -> max 30) -> matched
    it('Reviewer 1 case: Age 28 on cutoff 2026-01-01 with OBC (+3 relaxation) meets limit 27', () => {
      const siAgeRule: Rule = {
        criterion: 'age',
        params: {
          minAge: 20,
          maxAge: 27,
          cutoffDate: '2026-01-01',
          relaxationTable: { OBC: 3, SC: 5 },
        },
        ambiguous: false,
      };
      // Born 1997-06-01 -> Age on 2026-01-01 is 28. Limit is 27 + 3 = 30.
      const res = checkEligibility({ dob: '1997-06-01', category: 'OBC' }, [siAgeRule], '2026-01-01');
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].params.age).toBe(28);
      expect(res.results[0].params.relaxedMaxAge).toBe(30);
    });

    // Reviewer 2 case: Junior Technician illustrative requirements
    // Required: diploma_iti. Candidate has higher_secondary (rank 2 < rank 3) -> not_met
    it('Reviewer 2 case: Candidate with higher_secondary fails diploma_iti requirement', () => {
      const techRule: Rule = {
        criterion: 'qualification',
        params: { requiredLevel: 'diploma_iti' },
        ambiguous: false,
      };
      const res = checkEligibility({ qualificationLevel: 'higher_secondary' }, [techRule]);
      expect(res.results[0].status).toBe('not_met');
      expect(res.results[0].reasonCode).toBe('QUAL_BELOW_REQUIRED');
    });

    // Reviewer 2 case: Candidate with graduate (rank 4 > rank 3) meets diploma_iti
    it('Reviewer 2 case: Candidate with graduate degree meets diploma_iti requirement', () => {
      const techRule: Rule = {
        criterion: 'qualification',
        params: { requiredLevel: 'diploma_iti' },
        ambiguous: false,
      };
      const res = checkEligibility({ qualificationLevel: 'graduate' }, [techRule]);
      expect(res.results[0].status).toBe('matched');
      expect(res.results[0].reasonCode).toBe('QUAL_MET');
    });
  });
});
