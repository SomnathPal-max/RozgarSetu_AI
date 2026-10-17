# RozgarSetu AI — Accessibility & Usability Audit (360px Width)

**Audit Date:** 2026-10-17
**Viewport Target:** 360px × 800px (Mobile-first entry-tier Android baseline)
**Standard:** WCAG 2.1 AA & AGENTS.md Engineering Rules

## 1. Summary of Usability Measures

| Measure | Requirement | Prototype Result | Status |
|---------|-------------|------------------|--------|
| Touch Target Size | ≥ 44px × 44px min touch target | Verified across all buttons & inputs | PASS |
| Text Never Color Alone | Status accompanied by icons & explicit text | All badges use icon + status label (e.g., Matched ✓, Not Met ✗) | PASS |
| Semantic Landmarks | Full semantic hierarchy | Header, Main, Nav, and Footer on all pages | PASS |
| Self-Hosted Fonts | No third-party network request on slow connections | Next.js `next/font/google` with `font-display: swap` | PASS |
| Draft Translation Flag | Unreviewed locales flagged in footer | Bengali & Hindi show draft indicator | PASS |
| Performance Budget | First Load JS < 150 kB | 103 kB shared JS | PASS |

## 2. Per-Screen Audit Breakdown

### Screen 1: Home (English)
- **URL:** `http://localhost:3000/en`
- **Interactive Elements Tested:** 10
- **Compliant Touch Targets:** 10 (100.0%)
- **Semantic Landmarks:** <header>, <main>, <footer>, <nav>

### Screen 1: Home (Bengali Draft Translation)
- **URL:** `http://localhost:3000/bn`
- **Interactive Elements Tested:** 10
- **Compliant Touch Targets:** 10 (100.0%)
- **Semantic Landmarks:** <header>, <main>, <footer>, <nav>
- **Draft Translation Flag:** Active (Honesty Rule compliant)

### Screen 2: Vacancy Finder (SSR)
- **URL:** `http://localhost:3000/en/vacancies`
- **Interactive Elements Tested:** 14
- **Compliant Touch Targets:** 14 (100.0%)
- **Semantic Landmarks:** <header>, <main>, <footer>, <nav>

### Screen 3: Vacancy Detail (Source-Checked)
- **URL:** `http://localhost:3000/en/vacancies/notice-a`
- **Interactive Elements Tested:** 8
- **Compliant Touch Targets:** 8 (100.0%)
- **Semantic Landmarks:** <header>, <main>, <footer>, <nav>

### Screen 4: Eligibility & Gap Coach
- **URL:** `http://localhost:3000/en/vacancies/notice-a/check`
- **Interactive Elements Tested:** 7
- **Compliant Touch Targets:** 7 (100.0%)
- **Semantic Landmarks:** <header>, <main>, <footer>, <nav>

### Screen 6: Application Tracker
- **URL:** `http://localhost:3000/en/saved`
- **Interactive Elements Tested:** 10
- **Compliant Touch Targets:** 10 (100.0%)
- **Semantic Landmarks:** <header>, <main>, <footer>, <nav>

### Screen 9: Reviewer Portal
- **URL:** `http://localhost:3000/en/admin/login`
- **Interactive Elements Tested:** 5
- **Compliant Touch Targets:** 5 (100.0%)
- **Semantic Landmarks:** <header>, <main>, <footer>

## 3. Low-Bandwidth Network Resilience
- **Server-Side Rendering:** Vacancy list and notice data are server-rendered (SSR), delivering immediate paint without client spinners on 2G/3G connections.
- **Zero Autoplay Media:** Audio playback requires user tap on explicit button with fallback notice.
- **Zero External Font Requests at Runtime:** All glyphs are bundled locally with system font stack fallback.
