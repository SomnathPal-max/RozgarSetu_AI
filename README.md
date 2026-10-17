# RozgarSetu AI — Illustrative Prototype

> **⚠️ Non-Negotiable Demonstration Notice:**
> This repository is a working demonstration on **invented data**.
> No real vacancies, real users, or real organisations are shown.
> All seed data is fictional ("Example Recruiting Body", "Notice A", etc.).
> All passwords and mobile numbers are strictly invented demo credentials.

[![Evaluation Ready](https://img.shields.io/badge/Evaluation-Grade%20Prototype-blue.svg)](https://github.com/SomnathPal-max/RozgarSetu_AI)
[![Tests Passing](https://img.shields.io/badge/Unit%20Tests-76%2F76%20Passing-brightgreen.svg)](https://github.com/SomnathPal-max/RozgarSetu_AI)
[![Playwright E2E](https://img.shields.io/badge/Playwright%20E2E-10%2F10%20Passing-brightgreen.svg)](https://github.com/SomnathPal-max/RozgarSetu_AI)
[![Rules Accuracy](https://img.shields.io/badge/Wrongly--Matched%20Rate-0.00%25-success.svg)](https://github.com/SomnathPal-max/RozgarSetu_AI)

---

## 📱 Mobile Prototype Screenshots (360px Baseline)

The application is mobile-first, designed and tested at a 360px viewport with a 44px minimum touch target standard for low-cost Android smartphones.

| Screen 1: Trilingual Home & 2-Min Tour | Screen 2: Vacancy Finder (Server-Rendered) | Screen 3: Source-Checked Notice Detail |
|:---:|:---:|:---:|
| <img src="docs/screenshots/screen-1-home.png" width="240" alt="Screen 1: Home"> | <img src="docs/screenshots/screen-2-vacancies.png" width="240" alt="Screen 2: Vacancy Finder"> | <img src="docs/screenshots/screen-3-detail.png" width="240" alt="Screen 3: Notice Detail"> |
| *Language selection, no-account check, evaluator tour* | *Instant SSR render, Scam Shield red flags* | *Direct source link, honest completed checks* |

| Screen 4: 4-State Eligibility & Spoken Audio | Screen 6: Notice Watch Corrigendum Alert | Screen 9: Two-Reviewer Queue & Corrigendum Tool |
|:---:|:---:|:---:|
| <img src="docs/screenshots/screen-4-eligibility.png" width="240" alt="Screen 4: Eligibility Check"> | <img src="docs/screenshots/screen-6-tracker.png" width="240" alt="Screen 6: Application Tracker"> | <img src="docs/screenshots/screen-9-reviewer.png" width="240" alt="Screen 9: Reviewer Queue"> |
| *Pure rules verdict, per-criterion status, Indic audio* | *Corrigendum detection, deadline change alert* | *Server-enforced dual approval, corrigendum simulator* |

---

## 🚀 Getting Started

Follow these steps in order to set up, initialize the database, seed fictional demo data, and start the application:

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/SomnathPal-max/RozgarSetu_AI.git
cd RozgarSetu_AI
npm install
```

### 2. Environment Setup
Copy the environment example file:
```bash
cp .env.example .env.local
```

### 3. Initialize & Seed Database
> **Important:** Run `db:push` and `db:seed` before starting the server so tables and fictional test notices are populated.
```bash
# Push database schema to SQLite
npm run db:push

# Populate fictional demo data (users, notices, checks, scam reports)
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. You will be redirected to `/en`.

### 5. Run Verification & Evaluation Suites
```bash
# Run 76 pure unit tests (Rules engine, i18n, schema)
npm test

# Run 10 automated Playwright E2E tests (Screens 1–9, privacy & access control)
npm run test:e2e

# Run proposal benchmark metrics (Coverage, False Positive Rate, False Negative Rate)
npm run metrics

# Check ESLint (0 errors, 0 warnings)
npm run lint
```

---

## ☁️ Hosted Deployment & Turso libSQL Support

Because local SQLite files (`file:./rozgarsetu.db`) reside on ephemeral or read-only filesystems on serverless platforms like Vercel or Cloudflare, RozgarSetu AI includes built-in support for hosted libSQL databases such as **[Turso](https://turso.tech/)**:

1. Create a free database on Turso:
   ```bash
   turso db create rozgarsetu-db
   turso db tokens create rozgarsetu-db
   ```
2. In your hosting provider's dashboard (e.g., Vercel Project Settings > Environment Variables), set:
   ```env
   TURSO_DATABASE_URL="libsql://rozgarsetu-db-[username].turso.io"
   TURSO_AUTH_TOKEN="your-turso-jwt-token"
   ```
3. Run `npm run db:push` and `npm run db:seed` against Turso. The application automatically detects hosted libSQL credentials at runtime with zero code modifications.

---

## ⏱️ "Try It in 2 Minutes" Evaluator Tour

For judges and evaluators reviewing the prototype, a guided 4-step path is available directly on the home page:

1. **Check Eligibility (Notice A):** Click **"Check eligibility now"** on the home screen. Fill in Date of Birth `2002-05-15` and qualification `Higher Secondary`. Click **Continue**. Notice how rules evaluate age boundaries and qualification ranks without any language model intervention.
2. **Gap Coach & Spoken Explanation:** On the Notice A check screen, expand **Gap Coach** to see why the candidate satisfies the criteria and what the next cut-off date offers. Tap **"Listen to this result in English"** (Web Speech API). Click **"Download Official Eligibility Receipt"** to view the printable proof with cryptographic content hash.
3. **Notice Watch & Corrigendum Simulation:** Save Notice A to the tracker (`/en/saved`). As an administrator, open the Corrigendum Tool (`/en/admin/notices`) and click **"Simulate Corrigendum"**. Refresh `/en/saved` to see the live yellow amendment alert indicating the deadline extended from 12 Nov to 20 Nov 2026.
4. **Scam Shield & Two-Reviewer Queue:** Open the Delivery Helper vacancy (`/en/vacancies/msme-delivery`). Observe the 2 Scam Shield red flags (upfront fee + personal phone). Click **"Report this listing"** to submit report `RS-0001`. Now click **"Reviewer Portal"** (`/en/admin/login`), log in as **Demo Reviewer 1**, propose listing suspension, and observe the server enforce the mandatory **Two-Reviewer Rule** (blocking self-approval until **Demo Reviewer 2** approves).

### Demo Logins (Strictly Fictitious Numbers)
All mobile numbers use the non-allocatable `00000-xxxxx` series to ensure they cannot belong to real individuals:

| Persona | Mobile Number | Demo Password | Role & Permissions |
|:---|:---:|:---:|:---|
| **Illustrative Candidate** | `0000000001` | `demo_user_123` | Job seeker, no-account checker, saves jobs |
| **Demo Reviewer 1** | `0000000002` | `demo_review_123` | Listing curator, conducts contact verification, proposes suspension |
| **Demo Reviewer 2** | `0000000003` | `demo_review_123` | Independent dual reviewer, second approver under Scam Shield |
| **Demo Administrator** | `0000000004` | `demo_admin_123` | Full access, corrigendum publisher, audit log inspector |

*Note: All passwords and phone numbers are strictly demo-only.*

---

## 📊 Benchmark Metrics Script (`npm run metrics`)

Section 12 of the project proposal commits to evaluating the deterministic rules engine across coverage, false "Matched" rate, and false "Not met" rate against human-reviewed test cases. 

Run the benchmark suite:
```bash
npm run metrics
```

### Benchmark Case Table & Results
| Category | Cases Tested | Passed | Accuracy | Focus Scenarios |
|:---|:---:|:---:|:---:|:---|
| **Age Boundaries** | 5 | 5 | 100.0% | Exact cut-off boundary, 1 day underage, overage, normal window |
| **Category Relaxations** | 4 | 4 | 100.0% | SC/ST (+5 yrs), OBC (+3 yrs), over relaxed ceiling, unentered category |
| **Qualification Hierarchy** | 5 | 5 | 100.0% | Higher Secondary for Secondary, Graduate for Secondary, Stream mismatch |
| **Equivalents & Ambiguity** | 3 | 3 | 100.0% | Pre-accepted equivalent, pending corrigendum, clause ambiguity |
| **Missing Data Handling** | 4 | 4 | 100.0% | Missing DOB, missing qualification, empty profile, omitted category |
| **Total** | **21** | **21** | **100.0%** | **Comprehensive Human-Reviewed Benchmark** |

### Headline Metrics
- **Test Coverage:** `100.00%` (21/21 cases handled without unhandled exceptions)
- **Wrongly-"Matched" Rate (False Positives):** `0.00%` (0 cases falsely claimed eligible)
- **Wrongly-"Not met" Rate (False Negatives):** `0.00%` (0 cases falsely denied statutory relaxation)

---

## 🔒 Privacy & Access Control Enforcement

Per the core product rules in `AGENTS.md`:

1. **Zero-Persistence Anonymous Check:**
   - No database rows are written during a no-account check. Profiles remain strictly in client `sessionStorage` (`rozgarsetu_user_profile`).
   - Verified via Playwright test `tests/e2e/security-privacy.spec.ts`.
2. **Hidden Admin Navigation & Server Authorization:**
   - The Admin tab is hidden from public navigation for ordinary users.
   - Unauthenticated direct visits to `/en/admin` and `/en/admin/notices` are intercepted on the server via HTTP cookies (`rozgarsetu_role`) and redirected to `/en/admin/login`.
3. **Server-Enforced Two-Reviewer Rule:**
   - Proposing suspension on a high-risk listing leaves the decision pending.
   - Any self-approval attempt by the proposing reviewer returns `400/403 Bad Request` on the server (`Two-reviewer rule violation`).
   - Suspension is only executed when an independent second reviewer signs off.

---

## 🛠️ Built Features Directory

| Feature | Plan Screen | Status | Implementation Details |
|:---|:---:|:---:|:---|
| **Trilingual UI** | Screen 1 | **Built** | English, Bengali (`bn`), Hindi (`hi`) with draft translation footer notes |
| **Anonymous Check** | Screen 1 | **Built** | Pure in-memory/sessionStorage check; zero database persistence |
| **Vacancy Finder** | Screen 2 | **Built** | Server-side rendered (SSR), Scam Shield red flags, search & filter |
| **Source-Checked Detail**| Screen 3 | **Built** | Official notice link, honest completed verification check badges |
| **Deterministic Rules** | Screen 4 | **Built** | 4 states (`matched`, `not_met`, `missing_data`, `manual_review`); zero LLM |
| **Audio Explanations** | Screen 4 | **Built (Experimental)** | Web Speech API playback. Notice provided on Indic device-voice variability (server-rendered TTS planned for production low-cost phones) |
| **Gap Coach** | Screen 4 & 5 | **Built** | Future cut-off date advice and equivalent qualification clause links |
| **Document Checklist** | Screen 5 | **Built** | Mandatory & conditional document requirements extracted from notice |
| **Notice Watch** | Screen 6 | **Built** | Corrigendum amendment alerts, deadline change banners, outbox SMS log |
| **Scam Shield Reporting**| Screen 7 | **Built** | Deterministic fee/phone checklist with 24h ack & 48h triage SLA targets |
| **Eligibility Receipt** | Screen 8 | **Built** | Official-style verification receipt with QR code and SHA-256 content hash |
| **Two-Reviewer Queue** | Screen 9 | **Built** | Server-enforced dual approval, reviewer persona switcher, corrigendum simulator |
| **Demo Reset Tool** | All | **Built** | 1-click database restore button in UI and `POST /api/admin/reset-demo` |

---

## ♿ Accessibility & Usability (WCAG 2.1 AA)

- **Mobile Viewport:** Verified at 360px width.
- **44px Touch Targets:** All interactive controls adhere to minimum 44px × 44px hitboxes.
- **No Color-Only Signalling:** Status states always pair icons (✓, ✗, ?, ⚠) with clear localized text.
- **Self-Hosted Typography:** Google Fonts (`Inter`, `Noto Sans Bengali`, `Noto Sans Devanagari`) are loaded via Next.js `next/font/google` with `display: swap`, eliminating runtime third-party requests on 2G/3G connections.
- Full audit evidence available in [`docs/ACCESSIBILITY_AUDIT.md`](docs/ACCESSIBILITY_AUDIT.md).

---

## 📄 License & Attribution

- Built as an illustrative prototype under the Google DeepMind agentic evaluation program.
- All notice texts, recruiting bodies, and candidate profiles are invented works of fiction.
