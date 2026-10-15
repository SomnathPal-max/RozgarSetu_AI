# RozgarSetu AI: Prototype Build Plan for Google Antigravity
Source documents: Innovation & Implementation Plan and Design mock-up (screens 1 to 9). Goal: a clickable, working prototype of the core flow that can run the 3-minute demo in Section 12 of the plan, built on fictional data only.

## 0. How to use this file
Create an empty project folder and open it in Antigravity.
Save Section 2 as AGENTS.md in the project root (and, if your Antigravity version supports workspace rules, paste it there too). Every agent then sees the non-negotiable rules.
Put the mock-up PDF and this file in a /docs folder so agents can read them.
Run one agent per phase (Section 7), in order. For each phase, paste its kickoff prompt, review the implementation plan the agent proposes before approving it, then check the phase's acceptance tests yourself.
Do not start Phase 3 until the Phase 1 rules-engine tests pass. Eligibility is the part users act on.

## 1. Prototype scope
### In scope (build this)
- Screens 1 to 9 from the mock-up, working end to end on seed data.
- Rules-based eligibility engine with four statuses: Matched, Not met, Missing data, Needs manual review.
- Gap Coach, Document Readiness Checklist, Scam Shield flags, Notice Watch, Eligibility Receipt.
- Bengali / Hindi / English UI with a language switch on every screen, and audio playback of results.
- Report-a-listing with reference numbers, and a reviewer queue with a second-reviewer rule and audit trail.

### Out of scope (do not build)
- Real scraping or live integrations with any recruiting body.
- Real SMS or WhatsApp (stub it: write to an outbox table and show "SMS queued" in the UI).
- Document upload, spoken input, full admin dashboard, maps, MSME trust-ladder analytics, interview coaching.
- Any claim of real vacancies, real users, or real results. Everything on screen is labelled Illustrative.
- Honesty rule for the prototype: it is a working demonstration on invented data. The README and the footer must say so. This keeps the application consistent with the "no live integrations claimed" statement in your plan.

## 2. AGENTS.md (paste verbatim as project rules)
See AGENTS.md in project root.

## 3. Tech stack for the prototype
- Framework: Next.js (App Router) + TypeScript + Tailwind
- API: Next.js route handlers
- DB: SQLite via Drizzle ORM (schema written to be Postgres-portable)
- Rules engine: Pure TypeScript module + Vitest
- i18n: next-intl (or equivalent), locales en, bn, hi
- Audio: Browser Web Speech API (speechSynthesis) with bn-IN, hi-IN, en-IN
- Explanations: Templates (default) + optional LLM rewrite behind a flag
- Auth: Minimal: mobile + password, hashed, cookie session. No OTP
- Roles: reviewer, reviewer2, admin seeded demo users
- Tests: Vitest (engine, API), Playwright (demo flow)

## 4. Repository layout
```
/docs                      mock-up PDF, this plan
/src
  /app
    /[locale]
      page.tsx                       Screen 1 Start & language
      /vacancies/page.tsx            Screen 2 Finder
      /vacancies/[id]/page.tsx       Screen 3 Detail
      /vacancies/[id]/check/page.tsx Screen 4 Eligibility result
      /vacancies/[id]/documents/...  Screen 5 Checklist
      /saved/page.tsx                Screen 6 Tracker + Notice Watch
      /report/[vacancyId]/page.tsx   Screen 7 Report
      /receipt/[vacancyId]/page.tsx  Screen 8 Receipt (print CSS)
      /admin/page.tsx                Screen 9 Reviewer queue
      /admin/notices/page.tsx        "Simulate corrigendum" tool (for demo)
    /api/...
  /engine                            rules engine (pure) + tests
  /explain                           templates per language + optional LLM wrapper
  /db                                schema, migrations, seed
  /i18n                              en.json, bn.json, hi.json
  /components
/tests
  /engine    unit tests
  /e2e       Playwright demo script
```

## 5. Data model
Tables:
- users
- sources
- vacancies
- notice_versions
- rules
- document_items
- verification_checks
- scam_flags
- saved_jobs
- reports
- decisions
- audit_log
- outbox

## 6. Rules engine specification
See AGENTS.md and detailed logic in Section 6.

## 7. Phases
Phase 0: Scaffold
Phase 1: Schema, seed data, rules engine
Phase 2: Screens 1 to 3 (start, finder, detail)
Phase 3: Screen 4 (eligibility result, Gap Coach, audio)
Phase 4: Screens 5 and 6 (checklist, tracker, Notice Watch)
Phase 5: Screens 7 and 9 (report and reviewer queue)
Phase 6: Screen 8 (receipt) and polish
Phase 7: Demo script and evidence

## 8. The 3-minute demo
1. Open the app, pick a language, run the no-account check.
2. Search; open a vacancy; point out source, deadline, last-checked, verification status.
3. Show eligibility: Matched / Missing data / Not met with Gap Coach; switch Bengali, Hindi, English; play audio.
4. Show the document checklist; open the official source; save the job; set a reminder.
5. Admin simulates a corrigendum; Notice Watch alerts the user; result is re-stamped with the new version.
6. User reports a suspicious listing; Scam Shield flags visible; reviewer and second reviewer decide; audit trail shown.
