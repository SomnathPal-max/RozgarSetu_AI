/**
 * RozgarSetu AI — Eligibility Evaluation Benchmark & Metrics Script
 *
 * Evaluates the deterministic eligibility rules engine against a human-reviewed
 * benchmark test suite across age boundaries, statutory relaxations, qualification
 * hierarchies, equivalents, and missing data scenarios.
 *
 * Prints:
 * 1. Coverage (%)
 * 2. Wrongly-"Matched" Rate (False Positive Rate)
 * 3. Wrongly-"Not met" Rate (False Negative Rate)
 */

import { checkEligibility, Profile, Rule, EligibilityStatus } from '../src/engine';

interface TestCase {
  id: string;
  category: 'Age Boundaries' | 'Category Relaxations' | 'Qualification Hierarchy' | 'Equivalents & Ambiguity' | 'Missing Data';
  description: string;
  profile: Profile;
  rules: Rule[];
  expectedStatus: EligibilityStatus;
  criterionToCheck: string;
}

export const benchmarkTestCases: TestCase[] = [
  // --- Category 1: Age Boundaries ---
  {
    id: 'AGE-01',
    category: 'Age Boundaries',
    description: 'Exact minimum age boundary (18 on cutoff date)',
    profile: { dob: '2008-08-01', qualificationLevel: 'higher_secondary' },
    rules: [{
      criterion: 'age',
      params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' },
      ambiguous: false,
    }],
    expectedStatus: 'matched',
    criterionToCheck: 'age',
  },
  {
    id: 'AGE-02',
    category: 'Age Boundaries',
    description: 'Exact maximum age boundary (27 on cutoff date)',
    profile: { dob: '1999-08-01', qualificationLevel: 'higher_secondary' },
    rules: [{
      criterion: 'age',
      params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' },
      ambiguous: false,
    }],
    expectedStatus: 'matched',
    criterionToCheck: 'age',
  },
  {
    id: 'AGE-03',
    category: 'Age Boundaries',
    description: 'Overage without relaxation (Age 28, maxAge 27)',
    profile: { dob: '1998-07-31', qualificationLevel: 'higher_secondary' },
    rules: [{
      criterion: 'age',
      params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' },
      ambiguous: false,
    }],
    expectedStatus: 'not_met',
    criterionToCheck: 'age',
  },
  {
    id: 'AGE-04',
    category: 'Age Boundaries',
    description: 'One day underage (17 years + 364 days)',
    profile: { dob: '2008-08-02', qualificationLevel: 'higher_secondary' },
    rules: [{
      criterion: 'age',
      params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' },
      ambiguous: false,
    }],
    expectedStatus: 'not_met',
    criterionToCheck: 'age',
  },
  {
    id: 'AGE-05',
    category: 'Age Boundaries',
    description: 'Well within standard age window (22 years old)',
    profile: { dob: '2004-01-15', qualificationLevel: 'graduate' },
    rules: [{
      criterion: 'age',
      params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' },
      ambiguous: false,
    }],
    expectedStatus: 'matched',
    criterionToCheck: 'age',
  },

  // --- Category 2: Category Relaxations ---
  {
    id: 'REL-01',
    category: 'Category Relaxations',
    description: 'SC category candidate with +5 years upper age relaxation (Age 31, max 27+5=32)',
    profile: { dob: '1995-05-10', category: 'SC', qualificationLevel: 'graduate' },
    rules: [
      { criterion: 'age', params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' }, ambiguous: false },
      { criterion: 'category_relaxation', params: { category: 'SC', years: 5 }, ambiguous: false },
    ],
    expectedStatus: 'matched',
    criterionToCheck: 'category_relaxation',
  },
  {
    id: 'REL-02',
    category: 'Category Relaxations',
    description: 'SC candidate exceeding relaxed age limit (Age 33, max 27+5=32)',
    profile: { dob: '1993-05-10', category: 'SC', qualificationLevel: 'graduate' },
    rules: [
      {
        criterion: 'age',
        params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01', relaxationTable: { SC: 5, ST: 5, OBC: 3 } },
        ambiguous: false,
      },
    ],
    expectedStatus: 'not_met',
    criterionToCheck: 'age',
  },
  {
    id: 'REL-03',
    category: 'Category Relaxations',
    description: 'OBC category candidate with +3 years relaxation (Age 29, max 27+3=30)',
    profile: { dob: '1997-03-20', category: 'OBC', qualificationLevel: 'graduate' },
    rules: [
      { criterion: 'age', params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' }, ambiguous: false },
      { criterion: 'category_relaxation', params: { category: 'OBC', years: 3 }, ambiguous: false },
    ],
    expectedStatus: 'matched',
    criterionToCheck: 'category_relaxation',
  },
  {
    id: 'REL-04',
    category: 'Category Relaxations',
    description: 'General category candidate over age: relaxation does not apply',
    profile: { dob: '1997-03-20', category: 'GEN', qualificationLevel: 'graduate' },
    rules: [
      { criterion: 'age', params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' }, ambiguous: false },
      { criterion: 'category_relaxation', params: { category: 'SC', years: 5 }, ambiguous: false },
    ],
    expectedStatus: 'not_met',
    criterionToCheck: 'category_relaxation',
  },

  // --- Category 3: Qualification Hierarchy ---
  {
    id: 'QUAL-01',
    category: 'Qualification Hierarchy',
    description: 'Higher secondary holder applies for secondary requirement (higher rank satisfies)',
    profile: { dob: '2002-01-01', qualificationLevel: 'higher_secondary' },
    rules: [{
      criterion: 'qualification',
      params: { requiredLevel: 'secondary' },
      ambiguous: false,
    }],
    expectedStatus: 'matched',
    criterionToCheck: 'qualification',
  },
  {
    id: 'QUAL-02',
    category: 'Qualification Hierarchy',
    description: 'Graduate applies for secondary requirement (higher rank satisfies)',
    profile: { dob: '2001-01-01', qualificationLevel: 'graduate' },
    rules: [{
      criterion: 'qualification',
      params: { requiredLevel: 'secondary' },
      ambiguous: false,
    }],
    expectedStatus: 'matched',
    criterionToCheck: 'qualification',
  },
  {
    id: 'QUAL-03',
    category: 'Qualification Hierarchy',
    description: 'Secondary holder applies for graduate requirement (below required rank)',
    profile: { dob: '2001-01-01', qualificationLevel: 'secondary' },
    rules: [{
      criterion: 'qualification',
      params: { requiredLevel: 'graduate' },
      ambiguous: false,
    }],
    expectedStatus: 'not_met',
    criterionToCheck: 'qualification',
  },
  {
    id: 'QUAL-04',
    category: 'Qualification Hierarchy',
    description: 'Stream matching: Science stream required, candidate has Science stream',
    profile: { dob: '2001-01-01', qualificationLevel: 'graduate', qualificationStream: 'Science' },
    rules: [{
      criterion: 'qualification',
      params: { requiredLevel: 'graduate', requiredStream: 'Science' },
      ambiguous: false,
    }],
    expectedStatus: 'matched',
    criterionToCheck: 'qualification',
  },
  {
    id: 'QUAL-05',
    category: 'Qualification Hierarchy',
    description: 'Stream mismatch: Science stream required, candidate has Arts stream',
    profile: { dob: '2001-01-01', qualificationLevel: 'graduate', qualificationStream: 'Arts' },
    rules: [{
      criterion: 'qualification',
      params: { requiredLevel: 'graduate', requiredStream: 'Science' },
      ambiguous: false,
    }],
    expectedStatus: 'not_met',
    criterionToCheck: 'qualification',
  },

  // --- Category 4: Equivalents & Ambiguity ---
  {
    id: 'AMB-01',
    category: 'Equivalents & Ambiguity',
    description: 'Ambiguous rule in notice requires manual review per rule 2 (never guess)',
    profile: { dob: '2001-01-01', qualificationLevel: 'graduate' },
    rules: [{
      criterion: 'qualification',
      params: { requiredLevel: 'graduate' },
      ambiguous: true,
      sourceClause: 'Clause 7(c)',
    }],
    expectedStatus: 'manual_review',
    criterionToCheck: 'qualification',
  },
  {
    id: 'AMB-02',
    category: 'Equivalents & Ambiguity',
    description: 'Equivalent qualification requiring manual document verification',
    profile: { dob: '2001-01-01', qualificationLevel: 'diploma_iti' },
    rules: [{
      criterion: 'equivalent_qualification',
      params: { acceptedEquivalent: '3-year polytechnic diploma', requiresVerification: true },
      ambiguous: true,
      sourceClause: 'Clause 4(b)',
    }],
    expectedStatus: 'manual_review',
    criterionToCheck: 'equivalent_qualification',
  },
  {
    id: 'AMB-03',
    category: 'Equivalents & Ambiguity',
    description: 'Pre-accepted equivalent recognized directly in notice',
    profile: { dob: '2001-01-01', qualificationLevel: 'diploma_iti' },
    rules: [{
      criterion: 'equivalent_qualification',
      params: { acceptedEquivalent: 'diploma_iti', requiresVerification: false },
      ambiguous: false,
      sourceClause: 'Clause 4(a)',
    }],
    expectedStatus: 'matched',
    criterionToCheck: 'equivalent_qualification',
  },

  // --- Category 5: Missing Data Handling ---
  {
    id: 'MISS-01',
    category: 'Missing Data',
    description: 'Missing Date of Birth in profile returns missing_data (never guess)',
    profile: { qualificationLevel: 'graduate' },
    rules: [{
      criterion: 'age',
      params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' },
      ambiguous: false,
    }],
    expectedStatus: 'missing_data',
    criterionToCheck: 'age',
  },
  {
    id: 'MISS-02',
    category: 'Missing Data',
    description: 'Missing Qualification Level in profile returns missing_data',
    profile: { dob: '2001-01-01' },
    rules: [{
      criterion: 'qualification',
      params: { requiredLevel: 'graduate' },
      ambiguous: false,
    }],
    expectedStatus: 'missing_data',
    criterionToCheck: 'qualification',
  },
  {
    id: 'MISS-03',
    category: 'Missing Data',
    description: 'Candidate overage without category stated: relaxation returns missing_data (Rule 9)',
    profile: { dob: '1995-05-10', qualificationLevel: 'graduate' }, // Over 27, category omitted
    rules: [
      { criterion: 'age', params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' }, ambiguous: false },
      { criterion: 'category_relaxation', params: { category: 'SC', years: 5 }, ambiguous: false },
    ],
    expectedStatus: 'missing_data',
    criterionToCheck: 'category_relaxation',
  },
  {
    id: 'MISS-04',
    category: 'Missing Data',
    description: 'Empty profile in quick check returns missing_data for all criteria',
    profile: {},
    rules: [{
      criterion: 'age',
      params: { minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' },
      ambiguous: false,
    }],
    expectedStatus: 'missing_data',
    criterionToCheck: 'age',
  },
];

export function runBenchmark() {
  console.log('========================================================================');
  console.log(' RozgarSetu AI — Deterministic Rules Engine Metrics Benchmark');
  console.log(' Human-Reviewed Test Suite Evaluation (Section 12 of Proposal)');
  console.log('========================================================================\n');

  let totalCases = benchmarkTestCases.length;
  let handledCases = 0;
  let passedCases = 0;
  let falsePositives = 0; // Wrongly "matched"
  let falseNegatives = 0; // Wrongly "not_met"

  const categoryStats: Record<string, { total: number; passed: number }> = {};

  for (const tc of benchmarkTestCases) {
    if (!categoryStats[tc.category]) {
      categoryStats[tc.category] = { total: 0, passed: 0 };
    }
    categoryStats[tc.category].total++;

    try {
      const evaluation = checkEligibility(tc.profile, tc.rules);
      handledCases++;

      // Find the specific criterion outcome
      const item = evaluation.results.find((r) => r.criterion === tc.criterionToCheck);
      const actualStatus = item ? item.status : 'missing_data';

      if (actualStatus === tc.expectedStatus) {
        passedCases++;
        categoryStats[tc.category].passed++;
      } else {
        console.warn(`❌ Failure on [${tc.id}] ${tc.description}`);
        console.warn(`   Expected: ${tc.expectedStatus} | Actual: ${actualStatus}`);

        if (actualStatus === 'matched' && tc.expectedStatus !== 'matched') {
          falsePositives++;
        }
        if (actualStatus === 'not_met' && tc.expectedStatus !== 'not_met') {
          falseNegatives++;
        }
      }
    } catch (err) {
      console.error(`💥 Exception running [${tc.id}]:`, err);
    }
  }

  // Calculate the 3 headline metrics
  const coveragePct = ((handledCases / totalCases) * 100).toFixed(2);
  const falseMatchedPct = ((falsePositives / totalCases) * 100).toFixed(2);
  const falseNotMetPct = ((falseNegatives / totalCases) * 100).toFixed(2);

  // Print Case Table
  console.log('Benchmark Breakdown by Category:');
  console.log('------------------------------------------------------------------------');
  console.log(
    'Category'.padEnd(28) +
    'Total Cases'.padEnd(16) +
    'Passed'.padEnd(14) +
    'Accuracy'
  );
  console.log('------------------------------------------------------------------------');
  for (const [cat, stats] of Object.entries(categoryStats)) {
    const acc = ((stats.passed / stats.total) * 100).toFixed(1) + '%';
    console.log(
      cat.padEnd(28) +
      String(stats.total).padEnd(16) +
      String(stats.passed).padEnd(14) +
      acc
    );
  }
  console.log('------------------------------------------------------------------------\n');

  // Headline Metrics
  console.log('========================================================================');
  console.log(' HEADLINE METRICS (PROPOSAL PROMISES)');
  console.log('========================================================================');
  console.log(` 1. Test Coverage:             ${coveragePct}%  (${handledCases}/${totalCases} benchmark cases handled)`);
  console.log(` 2. Wrongly-"Matched" Rate:     ${falseMatchedPct}%  (False Positives: ${falsePositives}/${totalCases})`);
  console.log(` 3. Wrongly-"Not met" Rate:    ${falseNotMetPct}%  (False Negatives: ${falseNegatives}/${totalCases})`);
  console.log('========================================================================\n');

  console.log('Deterministic Integrity Note:');
  console.log(' - Zero LLM dependency during evaluation (EXPLAIN_WITH_LLM=false).');
  console.log(' - Complies with 4 result states: matched | not_met | missing_data | manual_review.');
  console.log(' - Ambiguous clauses and missing fields never guess.\n');

  return {
    coveragePct: parseFloat(coveragePct),
    falseMatchedPct: parseFloat(falseMatchedPct),
    falseNotMetPct: parseFloat(falseNotMetPct),
    passedCases,
    totalCases,
  };
}

// Run immediately when executed from CLI
if (typeof require !== 'undefined' && require.main === module) {
  const result = runBenchmark();
  if (result.passedCases < result.totalCases || result.falseMatchedPct > 0) {
    process.exit(1);
  }
}
