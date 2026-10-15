# RozgarSetu AI — Illustrative Prototype

> **⚠️ This is a working demonstration on invented data.**
> No real vacancies, real users, or real results are shown.
> All seed data is fictional. All organisation names are illustrative.

## What is this?

RozgarSetu AI is a prototype job vacancy finder and eligibility checker
designed for government and local MSME vacancies. It demonstrates:

- **Rules-based eligibility checking** (no AI decides eligibility)
- **Gap Coach** guidance based on notice data
- **Scam Shield** red-flag checklist
- **Notice Watch** corrigendum detection
- **Trilingual UI** (English, Bengali, Hindi)
- **Report-a-listing** with reviewer queue and second-reviewer rule

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS |
| Database | SQLite via libSQL / Drizzle ORM (Postgres-portable schema) |
| Rules Engine | Pure TypeScript module — zero DB/network access |
| i18n | next-intl with `en`, `bn`, `hi` locales |
| Testing | Vitest (unit) + Playwright (e2e) |

> **Note:** The prototype uses SQLite for zero-setup. The schema is written
> to be Postgres-portable for the pilot phase.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run unit tests
npm test

# Run linter
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected
to `/en` (English). Switch to Bengali or Hindi with the language toggle.

## Demo Accounts (Phase 1+)

| Role | Mobile | Password |
|------|--------|----------|
| User | 9000000001 | demo123 |
| Reviewer | 9000000002 | review123 |
| Second Reviewer | 9000000003 | review123 |
| Admin | 9000000004 | admin123 |

## Project Structure

```
/docs           Mock-up PDF, proposal, build plan
/src
  /app          Next.js App Router pages (screens 1–9)
  /components   Shared React components
  /engine       Pure eligibility rules engine + tests
  /explain      Explanation templates (per-language)
  /db           Drizzle schema, migrations, seed
  /i18n         Locale config & messages (en/bn/hi)
/tests
  /engine       Unit tests
  /e2e          Playwright demo script
```

## Important Disclaimers

- All data is **fictional**. No real organisations, notices, or people.
- Bengali and Hindi translations are **draft** (`_reviewed: false`).
  A "Draft translation" note appears in the footer.
- The platform **never submits applications** for users.
- Eligibility results are **PRELIMINARY** — always verify against
  the full official notice.
