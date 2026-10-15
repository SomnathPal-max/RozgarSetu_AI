# RozgarSetu AI: rules for all agents

## Product rules (never violate)
1. Rules decide eligibility. A language model NEVER decides eligibility. Core eligibility must work with the LLM switched off (EXPLAIN_WITH_LLM=false is the default).
2. Four result states only: matched | not_met | missing_data | manual_review. When a rule is ambiguous, conflicts, or data is missing, return manual_review or missing_data. Never guess.
3. Do NOT produce a single overall "eligible / not eligible" verdict. Show per-criterion results and a count summary only.
4. Every result links to the full official notice and says it is PRELIMINARY.
5. The app never submits an application for the user. "Applied" and "Interview" are set only by the user.
6. Badges list ONLY checks actually completed (stored as booleans with dates). The text "This badge does not guarantee a listing is safe." appears wherever a badge appears. Never use the words "safe", "guaranteed" or "trusted" as a claim.
7. Scam Shield is a deterministic checklist applied by a curator. No automated blocking.
8. No-account eligibility check: do not persist the entered profile server-side. Keep it in memory / sessionStorage only.
9. Collect only: name, mobile, date of birth, qualification. Category and disability are optional; without category, relaxation rules return missing_data.
10. All seed data is fictional. Use "Example Recruiting Body", "Illustrative Notice A" etc. Never use real organisation names, real notice numbers, real people.
11. Every user-facing string lives in locale files (en, bn, hi). No hard-coded strings in components. Bengali and Hindi files carry a `"_reviewed": false` flag until a native speaker signs off; show a small "Draft translation" note in the footer while any locale is unreviewed.

## Engineering rules
- TypeScript strict. Next.js App Router, Tailwind. Mobile-first (design at 360px width). Pages must work on slow networks: no heavy client bundles, no autoplay media, system font stack plus Noto Sans Bengali / Noto Sans Devanagari with font-display: swap.
- The rules engine is a pure module in /src/engine with no DB or network access, and has unit tests. Any change to /src/engine must keep all tests passing.
- Explanations come from per-language templates keyed by result code. If the optional LLM layer is on, validate that its output mentions the same statuses as the rule output; on mismatch fall back to the template.
- Accessibility: semantic HTML, 44px touch targets, visible focus, text never conveyed by colour alone, large-text mode toggle.
- Every state-changing admin action writes a row to audit_log with actor, action, reason, timestamp.
- Keep PRs/changes small and run `npm test` and `npm run lint` before finishing.
