# RozgarSetu AI — Source-Checked Job & Scheme Eligibility Platform

> **⚠️ Non-Negotiable Demonstration Notice:**
> This repository is a working demonstration on **invented data**.
> No real vacancies, real users, or real organisations are shown.
> All seed data is fictional ("Example Recruiting Body", "Illustrative Notice A", etc.).
> All passwords and mobile numbers are strictly invented demo credentials.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-rozgar--setu--ai.vercel.app-blue?style=for-the-badge&logo=vercel)](https://rozgar-setu-ai.vercel.app)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-76%2F76%20Passing-brightgreen.svg)](https://github.com/SomnathPal-max/RozgarSetu_AI)
[![Playwright E2E](https://img.shields.io/badge/Playwright%20E2E-14%2F14%20Passing-brightgreen.svg)](https://github.com/SomnathPal-max/RozgarSetu_AI)
[![Rules Accuracy](https://img.shields.io/badge/Wrongly--Matched%20Rate-0.00%25-success.svg)](https://github.com/SomnathPal-max/RozgarSetu_AI)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue.svg)](https://github.com/SomnathPal-max/RozgarSetu_AI)

RozgarSetu AI is a mobile-first, bilingual/trilingual civic technology platform designed for job seekers and rural kiosk operators (Common Service Centres / Sahayaks) across India. It helps candidates evaluate eligibility for government and local MSME employment opportunities with deterministic rules, transparent completed verification checks, and zero language-model hallucination on statutory qualifications.

---

## 🌐 Live Application & Repositories

- **Live Deployment:** [https://rozgar-setu-ai.vercel.app](https://rozgar-setu-ai.vercel.app)
- **Source Code:** [https://github.com/SomnathPal-max/RozgarSetu_AI](https://github.com/SomnathPal-max/RozgarSetu_AI)

---

## 📱 Mobile-First Screenshots (360px Baseline)

The application is built mobile-first, designed and evaluated at a 360px viewport with a 44px minimum touch target standard for low-cost Android smartphones and slow 2G/3G connectivity.

| Screen 1: Trilingual Home & 2-Min Tour | Screen 2: Vacancy Finder (Server-Rendered) | Screen 3: Source-Checked Notice Detail |
|:---:|:---:|:---:|
| <img src="docs/screenshots/screen-1-home.png" width="240" alt="Screen 1: Home"> | <img src="docs/screenshots/screen-2-vacancies.png" width="240" alt="Screen 2: Vacancy Finder"> | <img src="docs/screenshots/screen-3-detail.png" width="240" alt="Screen 3: Notice Detail"> |
| *Language switcher, no-account check, evaluator tour* | *Instant SSR render, Scam Shield red flags* | *Official notice link, honest verification badges* |

| Screen 4: 4-State Eligibility & Spoken Audio | Screen 6: Notice Watch Corrigendum Alert | Screen 9: Two-Reviewer Queue & Corrigendum Tool |
|:---:|:---:|:---:|
| <img src="docs/screenshots/screen-4-eligibility.png" width="240" alt="Screen 4: Eligibility Check"> | <img src="docs/screenshots/screen-6-tracker.png" width="240" alt="Screen 6: Application Tracker"> | <img src="docs/screenshots/screen-9-reviewer.png" width="240" alt="Screen 9: Reviewer Queue"> |
| *Per-criterion status, Gap Coach, Indic audio* | *Corrigendum detection, deadline change alert* | *Server dual approval, corrigendum simulator* |

---

## 🚀 Getting Started

Follow these steps in order to clone, set up, push the database schema, seed test notices, and run the platform locally:

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/SomnathPal-max/RozgarSetu_AI.git
cd RozgarSetu_AI
npm install
```

### 2. Environment Configuration
Create a local environment file based on `.env.example`:
```bash
cp .env.example .env.local
```

### 3. Initialize & Seed Database
> **Important:** Run `db:push` and `db:seed` before starting the server so database tables, fictional test notices, and demonstration reviewer accounts are created.
```bash
# Push Drizzle ORM schema to SQLite / libSQL
npm run db:push

# Seed fictional test data (notices, completed verification checks, demo accounts, scam reports)
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. You will be automatically routed to `http://localhost:3000/en`.

### 5. Run Verification & Quality Suites
```bash
# Run 76 unit tests (deterministic rules engine, date boundaries, i18n keys)
npm test

# Run 14 Playwright E2E tests (account isolation, 3-min demo flow, privacy & access control)
npm run test:e2e

# Run human-reviewed benchmark metrics (coverage, false positive rate, false negative rate)
npm run metrics

# Run ESLint (0 errors, 0 warnings)
npm run lint

# Run production build (type checking, static page generation)
npm run build
```

---

## 🔐 Citizen Account Creation & Multi-Tenant Isolation

RozgarSetu AI supports dual operating modes tailored to candidate privacy needs:

### A. Anonymous No-Account Eligibility Check (Zero-PII)
- Candidates can check eligibility instantly without registering or signing in.
- Profile details (DOB, qualification, stream) are stored **only in browser memory (`sessionStorage`)** and are **never transmitted to or saved in the database**.
- Fully automated Playwright test verifies zero database rows are written during an anonymous check.

### B. Registered Citizen Account
- **Registration (`/[locale]/auth/register`)**: Collects candidate name, 10-digit mobile number, secure password, date of birth, and highest qualification. Social category and disability status remain optional per `AGENTS.md` Rule 9.
- **Login (`/[locale]/auth/login`)**: Secure authentication with `bcryptjs` password verification and HTTP-only session cookies (`rozgarsetu_session`).
- **Multi-Tenant Account Isolation**: Every candidate strictly accesses only their own saved jobs, exam dates, registration numbers, and personal notes. Candidate A cannot see, edit, or delete Candidate B's saved records (`403 Forbidden` enforced on `/api/saved/[id]`).
- **Prominent Logout Button**: Instant log out available in the top navigation header and candidate account ownership banner.

---

## ⏱️ "Try It in 2 Minutes" Evaluator Tour

For evaluators and judges reviewing the platform, follow this quick 4-step journey:

1. **Check Eligibility (Notice A):**
   - Click **"Check eligibility now"** on the home screen (`/en`).
   - Enter Date of Birth `2002-05-15` and qualification `Higher Secondary`. Click **Continue**.
   - Notice how rules evaluate age limits and qualification tiers deterministically without LLM guesswork.
2. **Gap Coach, Indic Audio & Official Receipt:**
   - On the Notice A check screen, expand **Gap Coach** to see advice on upcoming cut-off dates and equivalent qualifications.
   - Tap **"Listen to this result in English"** (Web Speech API).
   - Click **"Download Official Eligibility Receipt"** to view the printable proof with cryptographic content hash (`RS-REC-...`) and verification QR code.
3. **Notice Watch & Corrigendum Simulation:**
   - Save Notice A to the tracker (`/en/saved`).
   - Open the Admin Corrigendum Tool (`/en/admin/notices`) and click **"Simulate Corrigendum"**.
   - Return to `/en/saved` to see the live yellow amendment alert indicating the application deadline extended from 12 Nov to 20 Nov 2026.
4. **Scam Shield & Two-Reviewer Queue:**
   - Open the Delivery Helper listing (`/en/vacancies/msme-delivery`). Observe the 2 Scam Shield red flags (upfront fee + personal WhatsApp number).
   - Click **"Report this listing"** to submit community report `RS-0001`.
   - Open the **Reviewer Portal** (`/en/admin/login`), log in as **Demo Reviewer 1**, and propose listing suspension.
   - Observe the server enforce the mandatory **Two-Reviewer Rule** (blocking self-approval until **Demo Reviewer 2** approves).

---

## 👥 Fictitious Demo Personas & Credentials

All mobile numbers use the non-allocatable `00000-xxxxx` series to guarantee they cannot belong to real individuals:

| Persona | Mobile Number | Demo Password | Role & Permissions |
|:---|:---:|:---:|:---|
| **Illustrative Candidate** | `0000000001` | `candidate_pass_123` | Job seeker; saves vacancies, tracks applications, sets reminders |
| **Demo Reviewer 1** | `0000000002` | `demo_review_123` | Listing curator; verifies contact details, proposes listing suspension |
| **Demo Reviewer 2** | `0000000003` | `demo_review_123` | Independent dual reviewer; second approver required under Scam Shield |
| **Demo Administrator** | `0000000004` | `demo_admin_123` | System administrator; publishes corrigenda, inspects live audit log |

*Note: All passwords, mobile numbers, and names are strictly fictional demo credentials.*

---

## 📊 Deterministic Rules Engine Metrics (`npm run metrics`)

Section 12 of the project proposal commits to evaluating the deterministic rules engine across coverage, false "Matched" rate, and false "Not met" rate against human-reviewed test cases.

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
| **Total Benchmark Suite** | **21** | **21** | **100.0%** | **Comprehensive Human-Reviewed Benchmark** |

### Headline Metrics
- **Test Coverage:** `100.00%` (21/21 benchmark cases handled)
- **Wrongly-"Matched" Rate (False Positives):** `0.00%` (0 cases falsely claimed eligible)
- **Wrongly-"Not met" Rate (False Negatives):** `0.00%` (0 cases falsely denied statutory relaxation)

---

## 🛠️ Complete Built Features Directory

| Feature | Plan Screen | Status | Implementation Details |
|:---|:---:|:---:|:---|
| **Trilingual UI** | Screen 1 | **Built** | English, Bengali (`bn`), Hindi (`hi`) with draft translation footer notes |
| **Anonymous Check** | Screen 1 | **Built** | Pure in-memory/sessionStorage check; zero database persistence |
| **Citizen Account & Login** | Screens 1 & 6 | **Built** | Registration (`/auth/register`), login (`/auth/login`), `bcryptjs` hashing, HTTP-only cookies |
| **Multi-Tenant Isolation** | Screen 6 | **Built** | Server-enforced saved jobs & notes segregation (`403 Forbidden` on tamper attempts) |
| **Prominent Logout** | Headers & Nav | **Built** | Accessible logout buttons in top header, account ownership banner, and admin portal |
| **Vacancy Finder** | Screen 2 | **Built** | Server-side rendered (SSR), Scam Shield red flags, search & category filtering |
| **Source-Checked Detail** | Screen 3 | **Built** | Official notice link, honest completed verification check badges |
| **Deterministic Rules** | Screen 4 | **Built** | 4 states (`matched`, `not_met`, `missing_data`, `manual_review`); zero LLM |
| **Audio Explanations** | Screen 4 | **Built (Experimental)** | Web Speech API synthesis with disclaimer on Indic device-voice variability |
| **Gap Coach** | Screens 4 & 5 | **Built** | Future cut-off date advice and equivalent qualification clause guidance |
| **Document Checklist** | Screen 5 | **Built** | Mandatory & conditional document requirements extracted directly from notice |
| **Notice Watch** | Screen 6 | **Built** | Corrigendum amendment alerts, deadline change banners, outbox SMS queue |
| **Scam Shield Reporting** | Screen 7 | **Built** | Deterministic fee/phone checklist with 24h ack & 48h triage SLA targets |
| **Eligibility Receipt** | Screen 8 | **Built** | Official-style verification receipt with QR code and SHA-256 content hash |
| **Two-Reviewer Queue** | Screen 9 | **Built** | Server-enforced dual approval, reviewer persona switcher, corrigendum simulator |
| **Demo Reset Tool** | All | **Built** | 1-click database restore button in UI and `POST /api/admin/reset-demo` |

---

## ☁️ Hosted Deployment & Turso libSQL Support

Because local SQLite files (`file:./rozgarsetu.db`) reside on ephemeral filesystems on serverless platforms like Vercel, RozgarSetu AI includes built-in support for hosted libSQL databases such as **[Turso](https://turso.tech/)**:

1. Create a free database on Turso:
   ```bash
   turso db create rozgarsetu-db
   turso db tokens create rozgarsetu-db
   ```
2. In your Vercel Project Settings > Environment Variables, configure:
   ```env
   TURSO_DATABASE_URL="libsql://rozgarsetu-db-[username].turso.io"
   TURSO_AUTH_TOKEN="your-turso-jwt-token"
   ```
3. Push the schema and seed data against the hosted database:
   ```bash
   npm run db:push
   npm run db:seed
   ```
The application automatically detects hosted libSQL credentials at runtime with zero code changes.

---

## ♿ Accessibility & Usability (WCAG 2.1 AA)

- **Mobile Viewport:** Verified at 360px width.
- **44px Touch Targets:** All interactive controls adhere to minimum 44px × 44px hitboxes.
- **No Color-Only Signalling:** Status states always pair icons (✓, ✗, ?, ⚠) with clear localized text.
- **Self-Hosted Typography:** Google Fonts (`Inter`, `Noto Sans Bengali`, `Noto Sans Devanagari`) are loaded via Next.js `next/font/google` with `display: swap`, eliminating runtime third-party requests on 2G/3G connections.
- Complete audit evidence available in [`docs/ACCESSIBILITY_AUDIT.md`](docs/ACCESSIBILITY_AUDIT.md).

---

## 📄 License & Attribution

- Built as an illustrative prototype under the Google DeepMind agentic evaluation program.
- All notice texts, recruiting bodies, and candidate profiles are invented works of fiction.
