# FinnaCalc Tax Platform — Technical Architecture & Product Roadmap

**Document type:** Architecture & viability proposal (pre-implementation)
**Audience:** Investors, board, senior engineering, prospective compliance/legal counsel
**Authors (roles assumed):** CTO · Principal Architect · Senior Tax Software Engineer · Security Architect · Product Manager · Compliance Consultant
**Status:** DRAFT FOR REVIEW — no implementation authorized by this document
**Prepared:** 2026

> **Purpose.** Determine whether a professional US tax preparation and filing platform is technically, legally, and commercially viable for FinnaCalc *before* a single line of production code is written. This document is deliberately skeptical. Where the brief makes an assumption that the regulatory or market reality contradicts, that assumption is challenged explicitly.

> **Reading note — the one thing to take away.** Building tax *preparation* software is a hard but normal software problem. Becoming an *IRS e-file transmitter* is a multi-year regulated-entity problem closer to standing up a payments or banking integration than to shipping a web app. The dominant risk in this venture is **not** engineering — it is **compliance, accuracy liability, and the cost of trust**. Plan, staff, and capitalize accordingly.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Scope](#2-product-scope)
3. [User Personas](#3-user-personas)
4. [System Architecture](#4-system-architecture)
5. [Recommended Technology Stack](#5-recommended-technology-stack)
6. [Tax Calculation Engine Architecture](#6-tax-calculation-engine-architecture)
7. [Data Model Design](#7-data-model-design)
8. [Security Architecture](#8-security-architecture)
9. [Compliance Analysis](#9-compliance-analysis)
10. [User Experience Architecture](#10-user-experience-architecture)
11. [Document Processing Strategy](#11-document-processing-strategy)
12. [Scalability Plan](#12-scalability-plan)
13. [Revenue Model](#13-revenue-model)
14. [Development Roadmap](#14-development-roadmap)
15. [Risk Assessment](#15-risk-assessment)
16. [Brutally Realistic Assessment](#16-brutally-realistic-assessment-difficulty-cost-staffing-timeline)

---

## 1. Executive Summary

FinnaCalc today is a suite of financial calculators and planning tools. The proposed evolution is into a **professional US tax preparation and filing platform** competing with TurboTax, FreeTaxUSA, H&R Block Online, Cash App Taxes, and TaxAct. This is a credible long-term ambition with a defensible wedge — FinnaCalc already owns the "trustworthy financial calculation" surface area — but it is also one of the most heavily regulated, accuracy-critical, and seasonally brutal categories in consumer software.

### Business goals
- Convert an existing calculator audience into a recurring, high-trust financial relationship with a once-a-year, high-intent monetization event (tax filing).
- Build a durable brand as a *premium financial institution*, not a discount tax site — margin and trust over race-to-free.
- Establish a data and relationship moat that extends into year-round tax planning and advisory.

### Technical goals
- A **deterministic, versioned, independently testable tax calculation engine** that is decoupled from UI and API and can be audited line-by-line against IRS rules per tax year.
- A **secure-by-construction** platform appropriate for SSNs, full income histories, and tax documents — encryption, least privilege, and complete audit logging as first-class architecture, not bolt-ons.
- An architecture that scales from 10K to 1M+ users with a **10–20× seasonal spike** (Jan–Apr) without 10–20× year-round cost.

### Product goals
- Launch a genuinely useful, *non-filing* MVP that builds trust and data (estimation, planning, document organization) while the filing/compliance machinery is built.
- Reach **federal e-file** for simple returns as the first real monetization milestone.
- Expand to **state filing** and eventually **AI-assisted document extraction** and advisory.

### Key risks (ranked, expanded in §15)
1. **Compliance & e-file authorization (CRITICAL).** Becoming an IRS Authorized e-file Provider and meeting IRS Pub 1345, Pub 4557, Pub 4164 (MeF), and the FTC Safeguards Rule is a hard gate. You cannot "ship and iterate" your way past the IRS.
2. **Calculation accuracy liability (CRITICAL).** A wrong number is not a bug ticket; it is a financial harm to a user and a reputational/legal event. Competitors offer "accuracy guarantees" that are real financial liabilities.
3. **Security breach of PII/tax data (CRITICAL).** This data set (SSN + income + address + dependents) is maximally attractive to attackers and maximally damaging if leaked.
4. **Seasonality (HIGH).** ~70–80% of revenue and load arrives in ~10 weeks. Mistakes during filing season are unrecoverable until next year.
5. **Incumbent moats & CAC (HIGH).** TurboTax spends heavily and owns the category; Cash App Taxes is free. Differentiating on "premium/trust" is plausible but unproven and expensive to seed.

### Key opportunities
- **Trust-led positioning** in a category users actively distrust (dark-pattern fatigue with TurboTax upsells; the IRS Direct File pilot signals demand for honest tools).
- **Year-round engagement** via the existing calculator audience — most tax apps are dead 9 months a year; FinnaCalc is not.
- **Freelancer/gig/investor segments** are underserved by truly *premium* (vs. either bargain-bin or bloated) experiences.
- **AI-assisted extraction and planning** as a genuine, defensible differentiator *if* introduced after the deterministic core is trusted.

### The headline recommendation
**Do not attempt to be an IRS e-file transmitter in year one.** Sequence the business so that the regulated, capital-intensive capability (direct MeF transmission) is the *last* thing you build, behind a deterministic engine and a trust-building non-filing product. Strongly evaluate **partnering with an existing authorized transmitter / MeF service bureau** for the first filing seasons to convert "become a regulated entity" from a blocking prerequisite into a vendor integration. This single decision changes the risk profile from *bet-the-company* to *staged and survivable*.

---

## 2. Product Scope

Scope is separated three ways throughout, per the brief: **Nice-to-have**, **Revenue-generating**, **Compliance-critical**. Each feature below is tagged `[NTH]`, `[REV]`, or `[CC]` (a feature can carry more than one tag).

### 2.1 MVP — Minimum viable launch (NO filing)

The MVP deliberately **does not transmit returns to the IRS.** It is a preparation, estimation, and organization product. This lets FinnaCalc launch in months, not years, build a data/trust moat, and validate demand before incurring e-file regulatory cost.

| Feature | Tag | Notes |
|---|---|---|
| Account creation, MFA, secure profile | `[CC]` | Identity + security are non-negotiable even pre-filing. |
| Guided tax **interview** (W-2, standard deduction, common credits) | — | The product's spine; reused forever. |
| **Deterministic federal estimate** for the current tax year (single, MFJ, HoH, etc.) | `[CC]` | Powered by the versioned engine (§6). Accuracy matters even for "estimates." |
| Refund / amount-owed estimate with bracket & marginal-rate explanation | — | Extends FinnaCalc's existing tax calculator. |
| **Document upload + secure vault** (W-2, 1099s) — store & organize, manual entry | `[CC]` | Storage of tax docs triggers Safeguards Rule obligations immediately. |
| Save / resume / multi-device sync of a return-in-progress | — | |
| Plain-language "what affects your taxes" explanations | `[NTH]` | Trust & education; cheap differentiation. |
| Export a **non-filable** PDF summary / worksheet | — | Clearly labeled "estimate, not a filed return." |
| Audit logging of all data access | `[CC]` | Required posture from day one. |

**Explicitly NOT in MVP:** e-filing, IRS transmission, state returns, OCR/AI extraction, professional review, payments for refunds/balance-due, prior-year returns.

### 2.2 Version 2 — After launch

| Feature | Tag |
|---|---|
| **Federal e-file for simple returns** (via partner transmitter — see §9) | `[REV] [CC]` |
| Paid tiers (premium filing, complex schedules) | `[REV]` |
| Itemized deductions, Schedule B/D basics (investors), Schedule C basics (freelancers) | `[REV]` |
| OCR extraction of W-2 / 1099 (assistive, human-confirmed) | `[NTH] [REV]` |
| Payment processing (filing fees; balance-due to IRS via authorized channels) | `[REV] [CC]` |
| Accuracy guarantee + audit-support offering | `[REV] [CC]` |
| Prior-year return import (PDF/known competitor formats) | `[NTH] [REV]` |
| Notifications (status, deadlines, "return accepted/rejected") | `[CC]` |

### 2.3 Long-Term Platform Vision — 3-year roadmap

| Feature | Tag |
|---|---|
| **State filing** (phased, high-population states first) | `[REV] [CC]` |
| Becoming a **direct** IRS Authorized e-file Provider / MeF transmitter (insourcing the partner) | `[CC] [REV]` |
| Self-employment / small-business depth (Schedule C/SE, depreciation, QBI, estimated quarterly payments) | `[REV]` |
| Investor depth (cap gains lots, wash sales, crypto, K-1s) | `[REV]` |
| AI-assisted preparation & anomaly detection ("this looks unusual vs. last year") | `[NTH] [REV]` |
| Year-round **tax planning / advisory** subscription | `[REV]` |
| Professional (CPA/EA) **review marketplace** | `[REV]` |
| Multi-year financial picture tying calculators ↔ taxes ↔ planning | `[NTH] [REV]` |

### 2.4 Scope challenge (assumption check)

- **"Mobile-first" (from the brief) is half-right and should be qualified.** Simple W-2 returns are genuinely mobile (Cash App Taxes proved this). Complex returns — investors with dozens of lots, small-business owners reconciling a Schedule C — are *desktop-and-document-heavy* work. Recommend **"mobile-first for simple, responsive-desktop-grade for complex."** Do not let "mobile-first" become "mobile-only" and amputate the high-margin complex segments. (Note: the current FinnaCalc codebase is intentionally desktop-only; the tax platform's public marketing/simple-filing surfaces will need a genuine responsive strategy, which is a real, budgeted workstream — not a Tailwind afterthought.)
- **"Both preparation and filing" should be sequenced, not simultaneous.** Preparation is software. Filing is regulated infrastructure. Conflating them in MVP is the most common way ventures like this die — they spend the first 18 months on IRS authorization and never ship anything users can touch.

---

## 3. User Personas

For each: **Goals**, **Pain points**, **Required workflows**. Personas are ordered by ascending complexity (and ascending willingness-to-pay).

### 3.1 W-2 Employee ("Maya, 29, salaried")
- **Goals:** File fast, maximize refund, not get audited, not get upsold to death.
- **Pain points:** Distrust of upsell-heavy incumbents; anxiety about "doing it wrong"; jargon.
- **Workflows:** Import/enter W-2 → confirm standard deduction → claim common credits (EITC, CTC, education) → review plain-language summary → file federal (+ state) → track acceptance.
- **Monetization:** Low. This is the **free/loss-leader** tier (matches Cash App Taxes pressure). Win on trust, convert later.

### 3.2 Freelancer ("Devin, 34, 1099 designer")
- **Goals:** Capture deductions (home office, equipment, software), handle self-employment tax, avoid underpayment penalties.
- **Pain points:** Quarterly estimated payments are confusing; doesn't know what's deductible; fears SE tax surprises.
- **Workflows:** Enter 1099-NEC income → guided Schedule C expense capture → SE tax calc → QBI → estimated-payment planner → file.
- **Monetization:** **High.** Premium tier; year-round quarterly-payment engagement is a subscription wedge.

### 3.3 Gig Worker ("Sam, 26, multi-app driver")
- **Goals:** Reconcile multiple 1099-Ks/NECs, claim mileage, keep it cheap and simple.
- **Pain points:** Multiple income sources; mileage/expense tracking; low margins make paid tiers a hard sell.
- **Workflows:** Aggregate multiple 1099s → mileage & expense entry → simplified Schedule C → file.
- **Monetization:** **Medium.** Price-sensitive but high-volume; mileage/expense tracking is a sticky NTH-to-REV bridge.

### 3.4 Investor ("Priya, 41, active brokerage + crypto")
- **Goals:** Correctly report cap gains/losses, handle wash sales, import broker data, minimize tax via loss harvesting.
- **Pain points:** Hundreds of lots; 1099-B reconciliation; crypto cost-basis chaos; K-1s arrive late.
- **Workflows:** Import 1099-B/8949 data → reconcile lots → wash-sale handling → Schedule D → review → file (often on extension).
- **Monetization:** **High.** Premium tier; strong tie-in to FinnaCalc's existing investing tools.

### 3.5 Small Business Owner ("Marcus, 47, S-corp / sole prop")
- **Goals:** Accurate business return, payroll/owner comp, depreciation, maximize legitimate deductions, audit defensibility.
- **Pain points:** Complexity; fear of audit; entity-type nuance; wants a human in the loop.
- **Workflows:** Business income/expense (often via accounting integration) → depreciation → QBI → owner comp → review (often with **professional review**) → file.
- **Monetization:** **Highest.** Premium + professional-review marketplace + advisory subscription. Likely needs CPA/EA partnership rather than pure self-serve.

### 3.6 Persona-level strategic read
The money is in **Freelancer → Investor → Small Business**, exactly the segments the brief names and exactly the segments that demand the most engine depth, the most document handling, and the most accuracy liability. The **W-2 segment is the trust-and-volume funnel, not the profit center.** Architecture and roadmap should optimize for *graduating* a user from free W-2 filing to a paid complex life event over years — which is why year-round engagement (FinnaCalc's existing strength) is the real moat.

---

## 4. System Architecture

### 4.1 Architectural principles
1. **The tax engine is a sovereign, isolated domain.** It does not import UI or web framework code, has no network or DB dependency, takes a typed input and returns a typed result, and is independently versioned and tested (§6). Everything else is replaceable around it.
2. **PII isolation.** Sensitive identifiers (SSN/TIN, raw documents) live in a tightly scoped, separately encrypted store with their own access path and audit trail — not sprinkled across every service and log line.
3. **Stateless, autoscaling compute; stateful data behind managed services.** Seasonal 10–20× spikes demand elastic compute and managed datastores, not hand-run servers.
4. **Everything sensitive is logged for audit; nothing sensitive is logged for debugging.** Two different pipelines.
5. **Build the boring parts on managed services; spend novel engineering only on the engine, the security model, and the UX.**

### 4.2 Logical components and relationships

```
                                   ┌──────────────────────────────┐
                                   │        Clients (TLS 1.3)     │
                                   │  Web (responsive) · Mobile   │
                                   └───────────────┬──────────────┘
                                                   │
                                        ┌──────────▼──────────┐
                                        │   Edge / CDN / WAF  │  rate limiting,
                                        │  (DDoS, bot mgmt)   │  TLS termination
                                        └──────────┬──────────┘
                                                   │
                                        ┌──────────▼──────────┐
                                        │     API Gateway     │  authN/authZ,
                                        │   (BFF for clients) │  request validation
                                        └─┬────┬────┬────┬────┘
              ┌──────────────────────────┘    │    │    └───────────────────────────┐
              │                                │    │                                │
   ┌──────────▼─────────┐         ┌────────────▼─┐  │  ┌───────────▼──────────┐  ┌───▼──────────────┐
   │  Identity & Auth   │         │  Returns /   │  │  │  Document Processing │  │  Tax Engine Svc  │
   │  (MFA, sessions,   │         │  Interview   │  │  │  (upload, OCR,       │  │  (stateless;     │
   │   RBAC, SSO)       │         │  Service     │  │  │   classification)    │  │   wraps engine   │
   └──────────┬─────────┘         └──────┬───────┘  │  └───────────┬──────────┘  │   library §6)    │
              │                          │          │              │             └───┬──────────────┘
              │                          │          │              │                 │
              │                   ┌──────▼──────────▼──────────────▼─────────────────▼────────┐
              │                   │                   Domain Data Stores                        │
              │                   │  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐ │
              │                   │  │ Core RDBMS   │  │ PII Vault     │  │ Document Object  │ │
              │                   │  │ (Postgres):  │  │ (separate     │  │ Storage (S3-class│ │
              │                   │  │ users,returns│  │ encrypted     │  │ SSE-KMS, no      │ │
              │                   │  │ calc results,│  │ store: SSN/   │  │ public access)   │ │
              │                   │  │ audit refs   │  │ TIN, secrets) │  │                  │ │
              │                   │  └──────────────┘  └───────────────┘  └──────────────────┘ │
              │                   └──────────────────────────────────────────────────────────┘
              │                                          │
   ┌──────────▼─────────┐   ┌──────────────────┐  ┌──────▼───────────┐  ┌─────────────────────┐
   │  Audit Log Service │   │  Notifications   │  │  Filing / e-File │  │  Payments Service   │
   │ (append-only,      │   │  (email/SMS/push,│  │  Transmission    │  │  (filing fees;      │
   │  tamper-evident,   │   │   deadline jobs) │  │  Gateway →       │  │  refund/balance-due │
   │  WORM archive)     │   │                  │  │  Partner / MeF   │  │  via licensed PSP)  │
   └────────────────────┘   └──────────────────┘  └──────────────────┘  └─────────────────────┘

   ┌──────────────────────────────────────────────────────────────────────────────────────────┐
   │  Cross-cutting: Secrets Manager · KMS · Observability (metrics/traces/logs) · Analytics    │
   │  (privacy-scrubbed, never raw PII) · Admin/Back-office console (heavily RBAC'd + audited)   │
   └──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Component responsibilities & technology rationale

**Frontend.** Server-rendered React (Next.js — already the FinnaCalc stack) for SEO on the calculator/marketing surface, fast first paint, and a single codebase for web. *Why:* reuse of existing team skill and design system; SSR matters for the top-of-funnel calculators. The tax interview is a long, branching form — invest in a robust form-state/validation layer and autosave.

**API Gateway / BFF.** A backend-for-frontend that handles authN/authZ, input validation, and orchestration so clients never talk to domain services directly. *Why:* single choke point for security policy, rate limiting, and request shaping; decouples client release cadence from service internals.

**Identity & Auth.** Dedicated service: MFA (TOTP + WebAuthn), session management, RBAC, and (later) SSO. *Why:* identity is too sensitive to scatter; isolating it enables focused hardening and audit. Strongly consider a reputable managed IdP (see §5) rather than hand-rolling crypto.

**Returns / Interview Service.** Owns the *state* of a return-in-progress: the interview graph, answers, derived facts, save/resume. Calls the Tax Engine Service for calculation. *Why:* separates *what the user said* (mutable, versioned per user) from *what the law computes* (deterministic engine).

**Tax Engine Service.** A thin, stateless wrapper around the engine **library** (§6). Takes a complete, validated return input; returns a complete calculation result + explanation trace. No DB, no side effects. *Why:* determinism and testability; it can be load-tested in isolation and scaled independently during peak.

**Document Processing.** Handles upload, virus scanning, classification, optional OCR/AI extraction (later), and secure storage references. *Why:* document handling has a distinct security and compute profile (large blobs, untrusted input) and should be sandboxed away from core data.

**Filing / e-File Transmission Gateway.** Translates an internal return into the IRS **MeF (Modernized e-File)** XML schema and transmits — initially **through an authorized partner/service bureau**, later directly. *Why:* MeF is a strict, versioned XML protocol with acknowledgement handling and reject-code remediation; isolating it contains that complexity and the regulated boundary.

**Payments.** Filing-fee collection (standard PSP like Stripe) and, separately, IRS balance-due/refund flows (which must use IRS-sanctioned mechanisms — direct debit/ACH, not a generic PSP). *Why:* the two money flows have completely different compliance regimes and must not be conflated.

**Notifications.** Email/SMS/push for status (accepted/rejected), deadlines, and lifecycle. Includes scheduled jobs (estimated-payment reminders). *Why:* "return rejected" is a time-critical, trust-critical message; it deserves a reliable, auditable channel.

**Audit Log Service.** Append-only, tamper-evident record of every access to sensitive data and every state transition of a return. *Why:* compliance (Safeguards Rule, IRS audit support) and incident forensics. This is **architecture, not logging** — it is a product requirement.

**Admin / Back-office.** Heavily RBAC'd, fully audited internal console for support, fraud review, and return troubleshooting. *Why:* insider risk on tax data is severe; admin access is a top breach vector and must be designed defensively (just-in-time access, four-eyes for sensitive actions).

**Analytics.** Product analytics on **privacy-scrubbed** events only — never raw financial values or PII. *Why:* you must improve funnel and conversion without ever turning the analytics pipeline into a shadow copy of the tax database.

### 4.4 Key relationship rules (invariants)
- The **Returns Service is the only writer** of return state; the **Tax Engine never persists**.
- **Raw SSNs/TINs and raw documents never enter** the core RDBMS, logs, analytics, or notifications — only the PII Vault and Document Storage hold them, behind their own keys and audit path.
- **Every** read of vault/document data emits an audit event *before* the data is returned.
- The **e-File gateway is the only component** permitted to egress to the IRS/partner network.

---

## 5. Recommended Technology Stack

Recommendations favor **managed, boring, auditable** technology. In a regulated, accuracy-critical, seasonal product, novelty is a liability everywhere except the engine and UX. Tradeoffs are stated honestly.

| Layer | Recommendation | Why | Tradeoff / alternative |
|---|---|---|---|
| **Frontend** | Next.js (React, TypeScript) | Existing team & design system; SSR for funnel; strong form ecosystem | Heavier than an SPA; SSR adds infra. Alt: Remix (similar), plain SPA (loses SEO). |
| **Tax Engine** | **TypeScript** (shared language) *or* a strongly-typed isolated module in Rust/Kotlin | Same-language sharing with frontend lowers friction; strict typing models tax rules well | A separate language (Rust) buys performance + isolation but adds a polyglot burden. **Recommend TS first**, isolate so it *could* be ported. |
| **Backend services** | TypeScript (Node) or Go | TS keeps one language; Go for CPU-bound/throughput services | Node is fine for I/O-bound orchestration; Go better for the engine service under peak. Avoid premature polyglot sprawl. |
| **Primary DB** | **PostgreSQL** (managed: RDS/Cloud SQL/Aurora) | Relational integrity for returns/lines/calcs; mature; encryption + PITR | Not infinitely horizontally scalable — addressed via read replicas + partitioning (§12). |
| **PII Vault** | Separate Postgres schema/instance with column/field-level encryption, *or* a dedicated secrets/tokenization service | Isolation + separate keys for the crown jewels | Adds complexity & a join boundary. Worth it. Alt: app-layer envelope encryption with KMS. |
| **Object storage** | S3-class with SSE-KMS, versioning, Object Lock (WORM) for finals | Documents & filed-return archives; retention enforceable | Lifecycle/retention config errors are a real risk — automate & test. |
| **Caching** | Redis (managed) | Session, interview-graph, idempotency keys, hot reference data (brackets) | Cache of anything user-financial must be short-TTL and namespaced per user; never cache PII. |
| **Queue / async** | Managed queue (SQS/PubSub) + workers | Document OCR, notifications, e-file submit/ack, retries | At-least-once delivery → all consumers must be idempotent. |
| **Infrastructure** | Containers on managed orchestration (ECS/Fargate or GKE/EKS) + IaC (Terraform) | Elastic for seasonal spikes; reproducible, reviewable infra | K8s is operationally heavy for a small team — **prefer Fargate-style serverless containers early**. |
| **Cloud provider** | **AWS** (primary recommendation) | Deepest managed-service catalog, KMS/CloudHSM, mature compliance posture (SOC 2/IRS-friendly), GovCloud optionality | Lock-in. Mitigate with IaC + portable container runtime. GCP is a fine alternative. |
| **Observability** | OpenTelemetry → managed backend (Datadog/Grafana Cloud/CloudWatch) | Traces across services; SLOs; peak-season visibility | Cost at scale; sampling needed. **Scrub PII at the SDK boundary.** |
| **Logging** | Structured JSON, central aggregation, **PII redaction filter mandatory** | Forensics + debugging without leaking | A single un-redacted field is a breach. Enforce via shared logger + tests. |
| **Monitoring/alerting** | SLO-based alerting; synthetic checks on filing path during season | Catch reject-rate spikes, latency, error budgets | Alert fatigue; tune ruthlessly before season. |
| **CI/CD** | Trunk-based, required checks (typecheck, unit, **engine golden tests**, security scan), staged deploys, IaC plan review | Safety + speed; engine changes gated by golden-master tests | Slows merges — acceptable and desirable for tax-affecting code. |
| **Testing** | Unit + **golden/snapshot fixtures from IRS examples** + property-based tests on the engine + E2E on filing flow + load tests pre-season | Determinism is provable; peak is rehearsed | Building the fixture corpus is significant labor — it is also the core asset (§6). |
| **Secrets** | Cloud secrets manager + KMS; no secrets in env files or repo | Rotation, audit, least privilege | Operational discipline required; enforce via scanning. |

**Stack-level challenges:**
- **Don't build your own IdP or crypto.** Use a vetted managed identity provider and KMS/HSM. Hand-rolled auth on tax data is negligence.
- **Don't go multi-cloud "for resilience" early.** It doubles the security surface and the compliance audit scope for marginal benefit at your scale. Single cloud, multi-AZ, with tested backups.
- **Resist Kubernetes until you have the team to run it.** It is a full-time SRE commitment; serverless containers get you to 100K users with a fraction of the ops load.

---

## 6. Tax Calculation Engine Architecture

This is the technical heart of the company and the one place to spend disproportionate engineering rigor. Requirements from the brief: **versioned by tax year, fully testable, deterministic, independent from UI, independent from API.** All four are satisfied by treating the engine as a **pure library** with no I/O.

### 6.1 Design tenets
- **Pure functions, no side effects.** `calculate(input, ruleset) → result`. No clock reads (tax year is an explicit input), no randomness, no network, no DB. Determinism is *enforced by construction*, then *proven by tests*.
- **Rules as data + code, versioned per year.** Brackets, standard deductions, phase-outs, credit parameters, and limits for each tax year live in versioned, reviewable rule sets. A 2024 return is *always* computed by the 2024 ruleset, forever — engines are never "upgraded" in place for prior years.
- **Explainability is a first-class output.** The engine returns not just numbers but a **trace**: which rules fired, which bracket applied, which deduction won (standard vs. itemized), why a credit phased out. This powers the UX's plain-language explanations *and* audit support.
- **Total isolation.** The engine package has zero dependencies on web, DB, or framework code. It could be lifted into a CLI, a Lambda, or a different company tomorrow.

### 6.2 Folder structure (illustrative)

```
/tax-engine
  /core
    types.ts            // FilingStatus, Money, RuleSetId, EngineInput, EngineResult, Trace
    money.ts            // integer-cents arithmetic, rounding rules (NO floats for currency)
    pipeline.ts         // orchestrates the ordered calculation stages
    errors.ts           // typed, structured calculation errors
  /rulesets
    /ty2024
      brackets.ts       // ordinary income brackets per filing status
      standard-deduction.ts
      credits/
        ctc.ts          // child tax credit + phase-out parameters
        eitc.ts
        education.ts    // AOTC / LLC
      deductions/
        salt.ts         // $10k cap logic
        student-loan.ts // $2,500 above-the-line cap
        medical.ts      // 7.5% AGI floor
      limits.ts         // contribution/phase-out constants
      manifest.ts       // ruleset id, effective dates, source citations (IRS pub refs)
    /ty2025
      ...               // next year, additive, never mutating ty2024
  /stages
    01-gross-income.ts
    02-adjustments.ts   // → AGI
    03-deductions.ts    // standard vs itemized selection
    04-taxable-income.ts
    05-tax-before-credits.ts
    06-credits.ts
    07-other-taxes.ts   // SE tax, NIIT, AMT (later)
    08-payments-withholding.ts
    09-final-liability.ts // refund or balance due
  /validation
    input-schema.ts     // structural validation (types, ranges, required-by-status)
    rule-validation.ts  // cross-field tax logic (e.g., can't claim X with Y)
  /tests
    /golden              // IRS-example-derived fixtures: input.json → expected-result.json
    /property            // property-based invariants
    unit/                // per-stage and per-rule unit tests
```

### 6.3 Rule engine design

Two layers, deliberately:

1. **Declarative parameters** (the *numbers*): brackets, thresholds, caps, phase-out start/end, credit amounts. These are pure data, keyed by tax year, with **source citations** (IRS publication/line references) attached for auditability. Changing a number is a reviewed data change, diffable in a PR.
2. **Imperative rule logic** (the *procedures*): how a phase-out interpolates, how the standard-vs-itemized choice is made, ordering of credits (non-refundable before refundable), how SE tax feeds AGI. This is code, unit-tested per rule.

This split means **most annual updates are data edits**, dramatically lowering the risk and effort of the yearly tax-law refresh — the single most recurring engineering obligation of a tax company.

### 6.4 Calculation pipeline

The pipeline is an **ordered, append-only sequence of stages**; each stage consumes the accumulated state and contributes new derived facts plus trace entries. Order matters because tax is sequential (AGI must exist before AGI-dependent floors/phase-outs).

```
EngineInput (validated)
  → [01] Gross income        (sum W-2, 1099, interest, dividends, cap gains, business, …)
  → [02] Adjustments         (student-loan interest, SE-tax ½, HSA, …) ⇒ AGI
  → [03] Deductions          (compute itemized w/ SALT cap & medical floor; pick max vs standard)
  → [04] Taxable income      (AGI − deduction, floored at 0)
  → [05] Tax before credits  (apply year/status brackets; capture marginal rate)
  → [06] Credits             (non-refundable first, then refundable; apply phase-outs)
  → [07] Other taxes         (SE tax, NIIT, AMT — phased in by roadmap)
  → [08] Payments/withholding
  → [09] Final liability      (refund or balance due) + full Trace
EngineResult
```

Each stage is independently testable and independently reviewable. The pipeline itself is trivial glue; the value is in the stages and rules.

### 6.5 Validation architecture

Two distinct validation phases (and a third at the service boundary):

- **Structural validation** (`input-schema`): types, required fields per filing status, numeric ranges, mutually-required fields. Runs before any calculation. Rejects malformed input with typed errors.
- **Tax-logic validation** (`rule-validation`): cross-field legality — e.g., dependent/credit interactions, status-incompatible claims, exceeding statutory caps. Produces user-actionable warnings/errors, not crashes.
- **Result validation** (in the service wrapper, not the engine): sanity invariants (no negative tax owed where impossible, refund ≤ total payments, etc.) as a defense-in-depth tripwire that fires alerts if the engine ever produces an impossible result.

### 6.6 Worked example (deterministic, illustrative)

> **Input:** Single filer, TY2024, W-2 wages \$80,000, federal withholding \$9,000, student-loan interest \$1,000, no dependents, no itemized deductions exceeding standard.

```
[01] Gross income        = 80,000
[02] Adjustments         = min(1,000, 2,500 cap) = 1,000  ⇒ AGI = 79,000
[03] Deductions          = max(standard 14,600, itemized 0) = 14,600  (standard wins)
[04] Taxable income      = 79,000 − 14,600 = 64,400
[05] Tax before credits  (TY2024 single brackets):
        10% to 11,600      = 1,160.00
        12% to 47,150      = 4,266.00
        22% on remainder   = (64,400 − 47,150) × .22 = 3,795.00
        → tax = 9,221.00 ; marginal rate = 22%
[06] Credits             = 0
[07] Other taxes         = 0
[08] Payments            = 9,000 (withholding)
[09] Final               = 9,000 − 9,221 = −221  ⇒ BALANCE DUE 221
Trace: [bracket boundaries crossed; standard deduction selected; no credits applicable]
```

This exact scenario becomes a **golden fixture**: `input.json → expected-result.json`. Any future engine change that alters this output fails CI until a human reviews and re-blesses it. The current FinnaCalc tax calculators already encode TY2024 brackets and standard deductions — those become the seed of the golden corpus and the first thing ported into the isolated engine.

### 6.7 The recurring obligation (challenge)
Tax law changes **every year**, sometimes mid-season (retroactive legislation). The engine must support **multiple live tax years simultaneously** (current-year filing + prior-year amendments) and **hot-patchable rulesets** without redeploying historical years. Budget a permanent **annual "tax law update" engineering+tax-research cycle** (Aug–Jan) as a fixed cost of being a tax company — not a one-time project. This is why the data/code split (§6.3) is not academic: it is the difference between a 2-week update and a 2-month one.

---

## 7. Data Model Design

High-level relational design (PostgreSQL). **Crown-jewel fields (SSN/TIN, raw documents) are deliberately *absent* from the core tables** and live in the PII Vault / object storage, referenced by token. Money is stored as integer cents.

### 7.1 Entities & key relationships

```
users ──1:N── tax_returns ──1:N── income_sources
  │               │     │
  │               │     ├──1:N── deductions
  │               │     ├──1:N── credits
  │               │     ├──1:1── tax_calculations (latest) / 1:N (history)
  │               │     └──1:N── documents (refs)
  │               │
  │               └──1:N── filings (e-file attempts + IRS acks)
  │
  ├──1:N── notifications
  ├──1:N── payments
  └──N:1── pii_vault_ref (tokenized SSN/TIN; separate store)

audit_logs ── references every sensitive access (append-only, separate retention)
```

### 7.2 Table sketches (illustrative columns)

**users**
`id` · `email` (unique) · `auth_provider_ref` · `mfa_enabled` · `status` · `created_at` · `pii_vault_token` (FK to vault, *not* the SSN) · `deleted_at` (soft-delete for retention)

**tax_returns**
`id` · `user_id` · `tax_year` · `filing_status` · `ruleset_id` (which engine version computed it) · `state` (`draft|review|ready|submitted|accepted|rejected|amended`) · `created_at` · `updated_at`

**income_sources**
`id` · `return_id` · `type` (`w2|1099_nec|1099_int|1099_div|1099_b|sch_c|rental|retirement|…`) · `amount_cents` · `withholding_cents` · `payer_ref` · `document_id?`

**deductions**
`id` · `return_id` · `type` (`mortgage_interest|salt|charitable|medical|student_loan|…`) · `amount_cents` · `is_above_the_line`

**credits**
`id` · `return_id` · `type` (`ctc|eitc|aotc|llc|dependent_care|…`) · `qualifying_count?` · `amount_claimed_cents` · `amount_allowed_cents` (post-phase-out, from engine)

**tax_calculations**
`id` · `return_id` · `ruleset_id` · `computed_at` · `total_income_cents` · `agi_cents` · `deduction_cents` · `using_itemized` · `taxable_income_cents` · `tax_before_credits_cents` · `credits_cents` · `tax_after_credits_cents` · `withholding_cents` · `refund_or_due_cents` · `marginal_rate` · `trace_json` (the explainability trace) — **immutable snapshots**, new row per recalculation for full history.

**documents** (metadata only; bytes live in object storage)
`id` · `return_id` · `kind` · `object_storage_key` · `sha256` · `virus_scan_status` · `ocr_status` · `uploaded_at` · `encryption_key_ref`

**filings**
`id` · `return_id` · `channel` (`partner|direct_mef`) · `submission_id` · `mef_payload_ref` · `status` · `irs_ack_code` · `reject_codes_json` · `submitted_at` · `acknowledged_at`

**payments**
`id` · `user_id` · `return_id?` · `kind` (`filing_fee|balance_due|refund`) · `amount_cents` · `processor` · `processor_ref` · `status` · `created_at` — **filing-fee and IRS-money flows are different `kind`s with different processors** (§4.3).

**notifications**
`id` · `user_id` · `channel` · `template` · `status` · `sent_at` · `related_return_id?`

**audit_logs** (append-only, separate store/retention, tamper-evident)
`id` · `actor` (user/admin/system) · `action` · `resource_type` · `resource_id` · `accessed_pii` (bool) · `ip` · `timestamp` · `request_id` · `prev_hash` (hash-chain for tamper evidence)

**pii_vault** (isolated store, separate keys)
`token` · `encrypted_ssn` · `encrypted_tin` · `key_version` · `created_at` — accessed only via the vault service, every read audited.

### 7.3 Modeling decisions & challenges
- **Calculation history is immutable and append-only.** You must be able to reproduce *exactly* what was shown to and filed by the user, with the exact ruleset — for audit support and dispute resolution. Never overwrite a calculation row.
- **`ruleset_id` is stored on every return and calculation.** This is what makes "versioned by tax year" real at the data layer, not just the engine layer.
- **Soft-delete + retention windows, not hard delete.** Tax records have statutory retention obligations (§9); deletion is a *scheduled, audited* lifecycle event, not a `DELETE`.
- **The core DB is a poor place for analytics.** Replicate privacy-scrubbed events to a separate analytics store; never let BI tools touch production tax data.

---

## 8. Security Architecture

**Threat model premise:** users hand us SSNs, full income, addresses, dependents' identities, and source documents. This is among the highest-value PII targets in existence. Assume nation-state-grade and organized-fraud-grade adversaries, plus the insider threat. Security here is **product, not infrastructure**.

### 8.1 Authentication
- **MFA mandatory** for any account holding tax data: TOTP and **WebAuthn/passkeys** (phishing-resistant) preferred; SMS only as a fallback (SIM-swap risk).
- Managed IdP; no hand-rolled password storage. Argon2id if any local hashing is ever unavoidable.
- Step-up authentication for sensitive actions (viewing SSN, submitting a filing, changing bank/payment info).
- Bot/credential-stuffing defense at the edge (WAF + rate limiting + device fingerprinting).

### 8.2 Authorization
- **RBAC + strict tenant isolation**: a user can only ever reach their own returns; every data access is authorization-checked at the service layer, not just the UI.
- **Least privilege for staff**; admin access is **just-in-time**, time-boxed, reason-logged, and **four-eyes** for the most sensitive operations (e.g., viewing a user's vault data).
- Object-level authorization tested explicitly (IDOR is the classic killer here).

### 8.3 Encryption
- **In transit:** TLS 1.3 everywhere, HSTS, modern ciphers only; internal service-to-service mTLS.
- **At rest:** full-disk + **field-level encryption** for SSN/TIN via KMS-managed envelope encryption; documents encrypted with per-object keys (SSE-KMS). Keys in **KMS/CloudHSM**, rotated, never in app config.
- **Key separation:** the PII vault uses a *different* key hierarchy than the core DB, so a core-DB compromise does not yield SSNs.

### 8.4 Secrets management
- Cloud secrets manager + KMS; automatic rotation; zero secrets in repo or env files; secret scanning in CI; short-lived workload identities instead of long-lived keys.

### 8.5 Audit logging
- **Every** access to PII/documents and **every** return state transition emits a tamper-evident (hash-chained), append-only audit record, stored separately with long retention. This is both a Safeguards Rule expectation and the backbone of incident forensics. Audit logs themselves contain **no** raw PII (reference by token/id).

### 8.6 Data retention & deletion
- Retention schedule aligned to IRS/legal requirements (§9): filed returns and supporting docs retained for the statutory window; drafts/abandoned returns purged on a defined timeline.
- **Right-to-delete** (state privacy laws) reconciled against **mandatory retention** — deletion requests honored only to the extent law permits, with the conflict documented and surfaced to the user.
- Deletion is a scheduled, audited, reversible-until-committed lifecycle job.

### 8.7 Backups & disaster recovery
- Encrypted, automated backups with **point-in-time recovery**; backups are in-scope for the same encryption/access controls as production (a backup is just an offline copy of the crown jewels).
- **Tested restores** (an untested backup is a hope, not a backup); documented RPO/RTO; cross-AZ, with cross-region copies for DR.
- Defined, rehearsed runbook for filing-season failover — downtime in April is existential.

### 8.8 Incident response
- Written IR plan with roles, severity levels, and **breach-notification obligations mapped to law** (state breach laws, IRS/FTC expectations, and notification timelines).
- On-call rotation; tabletop exercises **before** each filing season; pre-drafted user/regulator comms.
- Forensic readiness via the immutable audit log.

### 8.9 Threat detection
- Centralized security monitoring/SIEM; anomaly detection on access patterns (e.g., one account accessing many returns, off-hours admin access, geographic impossibilities).
- Alerting on engine **result-validation tripwires** (§6.5) and on **e-file reject-rate spikes** (a sudden jump can indicate a data or engine regression *or* fraud).

### 8.10 Rate limiting & abuse
- Tiered rate limits at edge and per-endpoint; stricter limits on auth, document upload, and filing endpoints; idempotency keys on all state-changing/financial operations.

### 8.11 Fraud prevention (a tax-specific, first-class concern)
- **Stolen-identity refund fraud (SIRF)** is the defining fraud vector in tax software: criminals file fraudulent returns using stolen identities to capture refunds. Mitigations: identity verification at signup/filing, device & behavioral signals, velocity checks (many returns from one device/IP/bank account), bank-account validation, and integration with IRS anti-fraud signals where available.
- Manual-review queue for high-risk filings; ability to hold/deny submission.
- This is not optional — being an e-file provider makes you a **fraud target by design**, and the IRS holds providers to anti-fraud standards (IRS Pub 1345).

### 8.12 Security challenges (honest)
- **The admin console and support tooling are your biggest practical breach risk**, not the front door. Most tax-data incidents are insider or support-tool misuse. Over-invest in JIT access, four-eyes, and admin audit.
- **OCR/AI document pipelines expand the attack surface** (untrusted file parsing, model/data exfiltration). Sandbox aggressively; this is a reason to *delay* AI extraction until the core is hardened (§11).
- **A single un-redacted log line can be a reportable breach.** Treat the logging redaction filter as security-critical code with its own tests.

---

## 9. Compliance Analysis

This section is the gate. Engineering can be fast; **compliance cannot be rushed**, and several items are hard legal prerequisites to handling real filings. Treat the items below as a roadmap with explicit "cannot launch without" markers. *(This is an engineering/architecture assessment, not legal advice — qualified tax-compliance counsel and an IRS e-file specialist must be engaged before any real filing.)*

### 9.1 IRS requirements (becoming an Authorized e-file Provider)
- **EFIN (Electronic Filing Identification Number):** Apply via IRS e-Services; principals undergo **suitability checks** (background, credit, tax-compliance, fingerprinting). This takes **months** and can be denied.
- **IRS Pub 1345** (handbook for authorized e-file providers): operational, security, and advertising rules you must follow.
- **IRS Pub 4164** (MeF guide): the technical spec for Modernized e-File XML, schemas, and acknowledgements.
- **Assurance Testing System (ATS):** Before going live, software must pass IRS **ATS** — submitting prescribed test scenarios that must match expected results exactly. This is a hard, scheduled, pass/fail gate each year.
- **Software developer vs. transmitter vs. ERO roles:** You may need multiple roles; each has distinct obligations.

### 9.2 e-File requirements
- MeF schema conformance, ack/reject handling, reject-code remediation UX, and per-year re-certification.
- **Annual re-testing**: ATS and schema updates recur every tax year — a permanent compliance cadence, not one-time.

### 9.3 Data privacy requirements
- **IRC §7216:** Strict federal rules on the **use and disclosure of taxpayer information** by preparers — consent requirements, criminal penalties for misuse. This directly constrains how you may use tax data for marketing, analytics, or cross-sell. **This is frequently underestimated and must shape the data architecture.**
- **State privacy laws** (CCPA/CPRA et al.): access/delete rights, reconciled with mandatory retention (§8.6).
- **GLBA / FTC Safeguards Rule** (see §9.4).

### 9.4 Security requirements
- **FTC Safeguards Rule (GLBA):** Tax preparers are "financial institutions" under GLBA. Requires a **written information security program**, a qualified individual responsible for it, risk assessments, encryption, MFA, access controls, monitoring, vendor oversight, and an incident-response plan. **This applies the moment you handle taxpayer financial information — including in a "preparation-only" product that stores documents.**
- **IRS Pub 4557** (Safeguarding Taxpayer Data) and **IRS Pub 5708** (written security plan guidance): the IRS's own security expectations for preparers.
- **IRS Security Summit / "Written Information Security Plan (WISP)"** expectation for preparers.

### 9.5 State filing requirements
- Each state has its **own** e-file program, schemas, registrations, and (sometimes) separate ATS-equivalent testing. Some states require separate registration as a software provider. **State filing is not "federal + a tax rate" — it is N additional integrations and N compliance regimes.** Sequence by population/ROI.

### 9.6 Record retention requirements
- Retain filed returns and supporting data per IRS/state rules (commonly multi-year). Retention obligations **override** generic "delete my data" requests for the regulated window (§8.6). Object Lock/WORM archive for finals.

### 9.7 Operational requirements
- Defined support obligations, advertising standards (Pub 1345 restricts certain claims), fee-disclosure rules, and the operational capacity to handle reject remediation during peak.

### 9.8 The explicit three-tier gate (as the brief demands)

**✅ What FinnaCalc CAN launch WITHOUT (the MVP, §2.1):**
- Tax **estimation/preparation**, document **organization/storage**, planning, and education — *provided* it already implements the **FTC Safeguards Rule / GLBA** program and §7216-compliant data handling, because storing taxpayer documents already triggers these. (So even "without filing" is not "without compliance.")

**🚧 What is REQUIRED before accepting REAL tax filings:**
- A complete **WISP** and Safeguards-Rule program with a named responsible individual.
- **§7216 consent flows** governing any use/disclosure of taxpayer data.
- Either a **partner transmitter relationship** (recommended first) *or* your own EFIN + e-file authorization.
- **Passing IRS ATS** for the relevant forms/year.
- Accuracy validation, reject-handling UX, audit logging, and incident response operational.

**🏛️ What is REQUIRED before becoming a DIRECT e-file provider/transmitter:**
- **EFIN** with passed suitability/background checks for principals.
- **MeF transmitter** setup, full **Pub 4164** schema conformance, and **annual ATS** certification.
- Direct IRS connectivity, ack/reject infrastructure, and the staff/SLA to operate it during season.
- Demonstrable Pub 1345 / Pub 4557 compliance and anti-fraud controls.

### 9.9 Compliance challenge (the load-bearing recommendation)
**Use a partner/service-bureau transmitter for the first 1–2 filing seasons.** This converts the hardest, slowest, pass/fail regulatory gate (your own EFIN + MeF + ATS) into a **vendor integration**, lets you reach revenue faster, and de-risks the venture enormously. Insource direct transmission later, once volume justifies the compliance overhead and you have the staff to run it. Treat "become a direct IRS transmitter" as a **3-year**, not a year-one, milestone.

---

## 10. User Experience Architecture

Design goal (from the brief): feel like a **premium financial institution**, not a consumer tax site — quiet luxury, editorial typography, high trust, accessible. The UX must do something hard: make an anxiety-inducing, jargon-heavy task feel calm, honest, and in-control. **Trust is the product.**

### 10.1 Onboarding
- Minimal-friction account creation; **MFA set up as a feature, not a chore** ("we protect your SSN like a bank").
- Honest, upfront scope: what FinnaCalc can/can't do *this* season (especially in the non-filing MVP — never imply filing you can't deliver).
- Progressive profiling: ask for the SSN late, only when needed, with a clear "why."

### 10.2 Tax interview flow
- A **branching, save-anywhere interview** backed by the interview-graph (Returns Service, §4). Skip logic driven by life-events ("Did you have a job?", "Freelance?", "Sell investments?") rather than form numbers.
- **Continuous estimate**: a live refund/owed figure that updates as the user answers (powered by the engine), with the marginal-rate explanation. This is FinnaCalc's existing strength — extend it.
- Plain-language everywhere; jargon available on tap, never required.

### 10.3 Review flow
- A clear, **explainable** summary: total income → AGI → deduction (and *why* standard vs. itemized won, using the engine trace) → taxable income → tax → credits → refund/owed.
- **Anomaly surfacing** ("this is much higher than last year — here's why / did you mean this?") to catch errors before filing.
- Explicit, non-dark-pattern pricing **before** the user is emotionally committed (a deliberate anti-TurboTax stance and a brand differentiator).

### 10.4 Error handling
- **Two error classes, handled differently:** (a) *user-fixable data issues* (missing field, implausible value) — inline, gentle, actionable; (b) *system/engine errors* — never show a raw error; capture, alert, and give the user a safe state ("we saved your progress; nothing was lost").
- **e-File reject remediation** is a first-class flow (V2): a rejected return must be turned into a clear "here's what to fix and resubmit," not an IRS reject code dumped on the user.

### 10.5 Document upload flow
- Drag-drop + mobile capture; immediate virus scan + classification; clear "stored securely, encrypted" affordance.
- In V2+, OCR pre-fills fields **with human confirmation** — never silently trust extraction (§11).

### 10.6 Tax filing flow (V2+)
- Explicit consent (§7216), final review, e-signature, submit → **real-time-ish status** (submitted → accepted/rejected) via notifications.
- Payment of filing fee (PSP) and any balance-due (IRS-sanctioned ACH/direct-debit) handled as distinct, clearly-explained steps.

### 10.7 Support flow
- Tiered: self-serve help → guided in-product help → human support → (premium) CPA/EA review. Support agents operate through the **audited, least-privilege admin console** (§4), never raw DB access.
- Seasonal staffing plan: support load is as spiky as compute load.

### 10.8 Mobile experience
- **Mobile-first for simple (W-2) returns**; document capture via camera is a genuine mobile advantage.
- **Responsive desktop-grade for complex returns** (investors, business owners) — these users *want* a big screen and multiple documents. Do not force complexity onto a phone (challenge to the brief's blanket "mobile-first").

### 10.9 Accessibility strategy
- WCAG 2.2 AA as a baseline requirement, not a stretch goal — a "high-trust, accessible" financial brand cannot ship inaccessible tax forms.
- Full keyboard navigation, screen-reader-correct form semantics, sufficient contrast (consistent with the existing premium design system), and accessible error messaging. Tax forms are exactly where accessibility failures exclude vulnerable users.

### 10.10 Illustrative user journey maps

**W-2 (Maya):** Land on calculator → "estimate my refund" → prompted to save/sign up → MFA → guided interview (job, standard deduction, credits) → live estimate → review with explanation → *(V2)* file → "accepted" notification → retention + next-year reminder.

**Freelancer (Devin):** Estimate → sign up → interview detects 1099 → guided Schedule C expenses → SE-tax + QBI explained → estimated-payment planner (year-round hook) → review → file → quarterly reminders (subscription wedge).

**Investor (Priya):** Sign up → interview detects investment sales → upload/import 1099-B → reconcile lots / wash sales → Schedule D → review anomalies → likely extension → file → carryover tracked for next year.

---

## 11. Document Processing Strategy

Question posed by the brief: should the platform support W-2/1099 uploads, OCR, PDF processing, and AI-assisted extraction? **Yes — but in a deliberate order, and never as the sole source of truth.**

### 11.1 Capabilities & assessment

| Capability | Benefit | Risk | Verdict |
|---|---|---|---|
| **Secure upload + storage (W-2/1099)** | Trust, organization, audit trail; required for support/filing | Triggers Safeguards Rule + storage security obligations immediately | **MVP** — but as storage only, with manual entry. |
| **PDF processing** | Many docs arrive as PDFs; parse structured ones | Malicious-file parsing surface; inconsistent formats | **V2**, sandboxed parsing. |
| **OCR extraction (W-2/1099)** | Big UX win (no manual typing); accuracy & speed | Extraction errors → wrong return → liability; expands attack surface | **V2, assistive only** — every extracted field human-confirmed. |
| **AI-assisted extraction/classification** | Handles messy/varied docs; future differentiator | Hallucination/accuracy, §7216 data-use limits, model security, explainability | **Long-term**, after the deterministic core is trusted; **never auto-files on AI output**. |

### 11.2 Why this order (challenge to "AI early")
The temptation is to lead with AI extraction as a flashy differentiator. **Resist it.** In a product where a wrong number is a financial harm and a regulatory event:
- AI extraction must sit **behind** a trusted deterministic engine and human confirmation, or it manufactures liability at scale.
- AI document processing **expands the security and privacy surface** (untrusted file parsing, model data handling under §7216) precisely when the org is least mature.
- The credible sequence is **manual → OCR-assisted (human-confirmed) → AI-assisted (human-confirmed) → AI-anomaly-detection**. Each step earns the trust to take the next.

### 11.3 Implementation guardrails
- All uploads: virus-scanned, type-validated, parsed in a **sandbox**, encrypted at rest with per-object keys.
- Extraction is **suggestion, not truth** — the user confirms every field that affects the return; the confirmed value (not the raw extraction) is what the engine consumes.
- Extraction accuracy is **measured** (field-level precision/recall) before it's allowed to pre-fill anything financial.

---

## 12. Scalability Plan

The defining scaling characteristic is **not** raw user count — it is **extreme seasonality**: roughly 70–80% of load and revenue arrives Jan–Apr, with a brutal mid-April peak and a secondary October (extension) spike. The architecture must scale **up and back down** to avoid paying for April capacity in July.

### 12.1 At 10,000 users
- Single-region, multi-AZ. Managed Postgres (primary + 1 read replica). Serverless containers (Fargate-style) with autoscaling. Redis for sessions/idempotency. This tier is comfortably handled by managed services with minimal ops.
- Focus: correctness, security posture, and **rehearsing the seasonal scale-up** before it matters.

### 12.2 At 100,000 users
- **Stateless services autoscale** on the seasonal curve; the **Tax Engine Service scales independently** (it's pure compute and the hot path during review/filing).
- Postgres: **read replicas** for read-heavy interview/review traffic; begin **partitioning by tax_year** (natural, time-based partition key) to keep working sets hot and archives cold.
- Async everything spiky: document OCR, notifications, and **e-file submission/ack via queues** so a burst of filings doesn't synchronously melt the request path.
- CDN for all static/marketing/calculator surfaces (cheap, absorbs top-of-funnel).

### 12.3 At 1,000,000+ users
- **Partition/shard** the core DB by user or tax_year; cold years to cheaper storage with WORM retention.
- Multi-region read paths if latency/DR demand it (weighed against doubled compliance scope — §5).
- Dedicated, isolated, independently-scaled **filing pipeline** for the April/October peaks with backpressure and graceful degradation (e.g., "your return is queued for transmission" is acceptable; data loss is not).
- **Pre-season load testing at projected peak × safety factor** is a mandatory, calendared event each year.

### 12.4 Caching strategy
- **Static reference data** (tax brackets, standard deductions, form metadata) is read-mostly and immutable per year — cache aggressively (and version by ruleset).
- **User financial state**: cache only short-TTL, per-user-namespaced, **never PII**; prefer recompute over stale tax numbers.
- Idempotency keys (cached) on all financial/state-changing operations to make at-least-once queues and client retries safe.

### 12.5 Cost optimization
- **Scale to near-zero in the off-season** — the single biggest cost lever; serverless/autoscaling compute is chosen specifically for this.
- Tiered storage with lifecycle policies (hot drafts → cold archived filings).
- Observability sampling (full traces in season, sampled off-season).
- Reserved/committed spend only for the genuinely always-on baseline; burst on on-demand.

### 12.6 Performance bottlenecks (anticipated)
- **The DB write path during peak filing** (returns moving to submitted/accepted) — mitigate with async queues, partitioning, and idempotency.
- **Document OCR/AI compute** — inherently bursty and expensive; queue + autoscale workers, and keep it off the synchronous path.
- **The e-file partner/MeF channel** — an external dependency with its own rate limits and seasonal stress; buffer with queues, handle backpressure, and have a degradation story.
- **The review-page recalculation** (continuous estimate) — keep the engine fast and stateless so it scales horizontally; cache reference data.

---

## 13. Revenue Model

Evaluated against the competitive reality: **TurboTax** monetizes aggressively via upsell; **FreeTaxUSA** is free-federal/paid-state; **Cash App Taxes** is fully free (a loss-leader for a fintech); **TaxAct/H&R Block** sit in between; and the **IRS Direct File** pilot is pushing the floor toward free for simple returns. Competing on price-to-zero is a losing game unless, like Cash App, you have another business to subsidize it. **FinnaCalc's thesis must be premium trust + year-round value, not cheapest filing.**

| Model | Pros | Cons | Verdict |
|---|---|---|---|
| **Free tier (simple federal)** | Funnel, trust, volume, competitive necessity | No direct revenue; cost + fraud exposure | **Yes** — loss-leader & trust builder, not profit. |
| **Premium filing (complex schedules)** | Clear value for freelancers/investors/SMB; high willingness-to-pay | Requires engine depth + accuracy liability | **Core revenue.** Aligns with the high-value personas. |
| **State filing fees** | Proven monetization (FreeTaxUSA model); incremental | N compliance integrations; price-sensitive | **Yes**, phased by state ROI. |
| **Subscription (year-round planning)** | Recurring revenue; breaks tax-season-only curse; leverages existing calculators | Must deliver continuous value to justify | **Strategic differentiator** — FinnaCalc's unfair advantage vs. seasonal incumbents. |
| **Tax planning services** | High-margin; deepens relationship; §7216-constrained but doable with consent | Requires expertise/content; advisory liability | **Yes**, mid-term. |
| **Professional (CPA/EA) review** | Premium tier for SMB/complex; trust capstone; marketplace economics | Requires vetted human network; ops-heavy; liability | **Yes** for the SMB/investor segments; likely **partnership-driven**. |

### 13.1 Recommended revenue architecture
1. **Free** simple federal (trust + funnel).
2. **Paid premium** for freelancers/investors/SMB (the profit center, matched to the high-WTP personas).
3. **State filing** as incremental paid add-on, phased.
4. **Year-round subscription** (planning, estimated-payments, multi-year view) — the recurring-revenue moat that no seasonal competitor can easily match because they go dormant in May.
5. **Professional review** as the premium capstone for complex returns.

### 13.2 Revenue challenges (honest)
- **Free is table stakes and getting freer** (Direct File). Your free tier will lose money; it must be *cheap to serve and ruthless on fraud*, justified only by conversion to paid/subscription.
- **CAC is brutal and seasonal.** You acquire in a 10-week window against companies outspending you 100:1. The **existing FinnaCalc calculator audience is your cheapest, most defensible acquisition channel** — lean on it hard; do not try to out-advertise TurboTax.
- **§7216 limits monetizing the data itself.** You largely cannot quietly sell or cross-leverage taxpayer data; revenue must come from *services the user pays for*, not data exhaust. Architect with that constraint, not against it.

---

## 14. Development Roadmap

Realistic phasing. **Compliance and the engine are the long poles**, and they are front-loaded. Timelines assume a small-but-senior team scaling over time (staffing in §16) and are *deliberately conservative* — tax software that ships fast and wrong is worse than tax software that ships late.

### Phase 0 — Research & Architecture (≈ 2–3 months)
- **Goals:** Validate viability (this document), engage tax-compliance counsel + an e-file specialist, decide build-vs-partner for transmission, finalize the engine design and security model.
- **Deliverables:** Approved architecture; compliance gap analysis; partner-transmitter shortlist; WISP outline; engine spec + golden-fixture plan.
- **Risks:** Underestimating compliance; analysis paralysis. **Mitigation:** time-box; get counsel early.
- **Team:** CTO/architect, senior tax-domain advisor (fractional EA/CPA), security architect (fractional), PM.

### Phase 1 — Core Platform Foundation (≈ 3–4 months)
- **Goals:** Secure account system (MFA), data model, PII vault, document upload/storage, audit logging, observability, CI/CD — **the Safeguards-Rule-compliant skeleton**.
- **Deliverables:** Auth + RBAC; encrypted vault + object storage; audit pipeline; IaC; the security baseline that even a non-filing product legally needs.
- **Risks:** Security shortcuts under schedule pressure. **Mitigation:** security review gates; no PII in logs from day one.
- **Team:** + 2–3 senior backend, 1 frontend, 1 security/DevOps.

### Phase 2 — Tax Engine MVP (≈ 3–4 months, overlaps P1)
- **Goals:** Deterministic, versioned, isolated engine for **simple federal returns** (W-2, standard deduction, common credits) with full golden-fixture coverage and explainability trace. Launch the **non-filing MVP** (§2.1).
- **Deliverables:** Engine library + service; golden corpus seeded from IRS examples (and existing FinnaCalc calculators); live estimate + review UX; public preparation/estimation product.
- **Risks:** Accuracy gaps; scope creep into complex returns. **Mitigation:** strict MVP scope; property-based + golden tests as merge gates.
- **Team:** + tax-domain engineer(s); QA with tax literacy.

### Phase 3 — Federal Filing MVP (≈ 4–6 months)
- **Goals:** First **real federal e-file** for simple returns — **via partner transmitter**; pass **ATS**; reject-remediation UX; §7216 consent; payments (filing fee + balance-due channel); fraud controls v1.
- **Deliverables:** End-to-end file → accepted/rejected; WISP finalized; anti-fraud queue; status notifications.
- **Risks:** **ATS failure / partner-integration delays / fraud.** **Mitigation:** start ATS early in the cycle; partner de-risks the regulated gate; fraud review before scale.
- **Team:** + compliance lead (full-time), payments/integration engineer, fraud/risk analyst, seasonal support.

### Phase 4 — State Filing Expansion (≈ ongoing, 6–12+ months)
- **Goals:** State e-file for high-population states first; each is a distinct integration + compliance regime.
- **Deliverables:** Prioritized state rollout; per-state engine rulesets + testing.
- **Risks:** Per-state complexity explosion; cost > revenue for small states. **Mitigation:** ROI-ranked rollout; reuse engine architecture; partner coverage where possible.
- **Team:** + state-tax domain engineers; more QA.

### Phase 5 — Automation & AI Features (≈ ongoing, year 2–3+)
- **Goals:** OCR → AI-assisted extraction (human-confirmed); anomaly detection; year-round planning subscription; professional-review marketplace; potentially insourcing direct MeF transmission.
- **Deliverables:** Assistive document pipeline; advisory products; (optional) own EFIN + direct transmitter.
- **Risks:** AI accuracy/liability; §7216 limits; insourcing compliance load. **Mitigation:** AI assistive-only behind the deterministic core; insource transmission only when volume justifies.
- **Team:** + ML engineers (sandboxed), CPA/EA network, expanded compliance/ops.

---

## 15. Risk Assessment

Risks ranked **Low / Medium / High / Critical** with mitigations. Critical risks are existential and gate the whole venture.

### Technical risks
| Risk | Rank | Mitigation |
|---|---|---|
| Tax-calculation inaccuracy | **Critical** | Deterministic isolated engine; golden + property tests as merge gates; result-validation tripwires; ATS conformance; result history immutable. |
| Annual tax-law update breaking prior years | **High** | Year-versioned rulesets (never mutate past years); data/code split; multi-year live support; regression golden tests. |
| Seasonal load failure (April peak) | **High** | Autoscaling stateless compute; queue-buffered filing; pre-season load tests at peak×safety; rehearsed runbooks. |
| External e-file/partner dependency outage | **High** | Queue + backpressure + graceful degradation ("queued for transmission"); multi-partner optionality long-term. |
| Document-parsing / AI accuracy | **Medium** | Assistive-only, human-confirmed; sandboxed parsing; measured field accuracy before pre-fill. |

### Compliance risks
| Risk | Rank | Mitigation |
|---|---|---|
| Failure/delay obtaining EFIN + e-file authorization | **Critical** | **Partner transmitter first**; start suitability process early; engage e-file specialist in Phase 0. |
| ATS certification failure | **Critical** | Begin ATS early each cycle; golden fixtures mirror IRS test scenarios; treat as a hard release gate. |
| §7216 taxpayer-data misuse | **High** | Consent flows; data-use constraints baked into architecture; legal review of every data use/marketing path. |
| FTC Safeguards Rule non-compliance | **High** | WISP + program from Phase 1 (applies even pre-filing); named responsible individual; vendor oversight. |
| State filing non-compliance | **Medium** | Phased, ROI-ranked rollout; per-state legal review; partner coverage. |

### Security risks
| Risk | Rank | Mitigation |
|---|---|---|
| Breach of SSN/PII/tax documents | **Critical** | Key-separated PII vault; field-level encryption; least privilege; tamper-evident audit; tested IR plan; breach-notification readiness. |
| Insider / admin-tool misuse | **High** | JIT + four-eyes admin access; full admin audit; no raw-DB support access; anomaly detection. |
| Stolen-identity refund fraud (SIRF) | **High** | Identity verification; device/behavioral signals; velocity checks; manual review queue; IRS fraud-signal integration. |
| PII leakage via logs/analytics | **High** | Mandatory redaction filter (tested as security code); privacy-scrubbed analytics; never raw financial values off-platform. |
| Credential stuffing / account takeover | **Medium** | Mandatory phishing-resistant MFA; edge bot defense; step-up auth on sensitive actions. |

### Business risks
| Risk | Rank | Mitigation |
|---|---|---|
| Incumbent dominance + brutal CAC | **High** | Lead with existing calculator audience (cheap channel); premium/trust positioning; year-round subscription moat — don't out-spend TurboTax. |
| Race-to-free (Cash App, IRS Direct File) | **High** | Don't compete on free for profit; monetize complexity + services + recurring planning. |
| Seasonality concentrates revenue & risk | **High** | Year-round subscription/planning to flatten the curve; off-season cost scale-down. |
| §7216 limits data monetization | **Medium** | Service-based revenue model designed around the constraint from day one. |

### Operational risks
| Risk | Rank | Mitigation |
|---|---|---|
| Seasonal support overload | **High** | Tiered self-serve + scaled seasonal support; reject-remediation UX reduces tickets. |
| Annual recertification / law-update cadence missed | **High** | Calendared Aug–Jan update cycle as fixed cost; dedicated tax-research + engine capacity. |
| Key-person dependency on tax-domain expertise | **Medium** | Build CPA/EA bench; document rulesets with citations; avoid single-expert bottleneck. |
| Untested backups / DR | **Medium** | Scheduled restore tests; documented RPO/RTO; pre-season DR drills. |

---

## 16. Brutally Realistic Assessment (Difficulty, Cost, Staffing, Timeline)

The brief demands honesty over optimism. Here it is.

### 16.1 Difficulty
**High-to-extreme — but mostly for non-engineering reasons.** The software (interview, engine, secure storage) is hard-but-tractable senior-engineering work. What makes this category genuinely hard is the **convergence** of: (1) zero-tolerance accuracy with real financial liability, (2) a slow, pass/fail federal regulatory gate you cannot negotiate or "iterate" past, (3) maximally-sensitive data with nation-state-grade adversaries, (4) a 10-week revenue/load window where mistakes are unrecoverable for a year, and (5) entrenched, deep-pocketed incumbents plus a free-tier floor. Any one is manageable; **together they are why few startups successfully enter this space.**

### 16.2 The single biggest mistake to avoid
Spending 18 months and the seed round trying to become a direct IRS transmitter before shipping anything users can touch. **Sequence it:** non-filing trust-building MVP → partner-transmitted federal filing → state expansion → (only then) direct transmission. The partner-transmitter decision is the difference between a survivable staged build and a bet-the-company moonshot.

### 16.3 Cost (order-of-magnitude, *planning estimates, not quotes*)
- **Phase 0–2 (architecture → engine → non-filing MVP):** roughly **\$0.6M–\$1.5M** — a small senior team for ~9–12 months, fractional compliance/security counsel, modest infra. This gets a real, trust-building product live.
- **Phase 3 (partner-transmitted federal filing, ATS, WISP, fraud, payments):** add roughly **\$1M–\$2.5M+** — full-time compliance lead, partner integration, fraud/risk, seasonal support, legal.
- **Phases 4–5 (state expansion, AI, advisory, possible insourced transmission):** **multi-million, ongoing**, scaling with footprint.
- **Permanent annual cost:** a **fixed yearly "tax-law update + recertification" cycle** (engineering + tax research, Aug–Jan) — this never goes away. Budget it as a standing line item, not a project.
- **Infra cost is seasonal** by design — architect for near-zero off-season to avoid paying April prices in July.

*(These are directional planning ranges to set investor expectations, not bids. Real figures depend on partner terms, state footprint, and team geography.)*

### 16.4 Staffing
- **Phase 0–1:** CTO/architect, 2–3 senior backend, 1 senior frontend, 1 security/DevOps, fractional tax-domain advisor (EA/CPA), fractional compliance counsel, PM. (~6–8 people, senior-heavy.)
- **Phase 2–3:** + dedicated **tax-domain engineer(s)**, **full-time compliance lead**, payments/integration engineer, **fraud/risk analyst**, QA with tax literacy, seasonal support. (~12–18.)
- **Phase 4–5:** + state-tax engineers, ML engineers (for sandboxed extraction), CPA/EA review network, expanded ops/support. (Scales with footprint.)
- **Non-negotiable hires:** a real **compliance/e-file specialist** and a **security lead** are not "later" roles — they shape the architecture and must be engaged in Phase 0. Treating compliance as a Phase-3 afterthought is the classic fatal error.

### 16.5 Timeline
- **Non-filing MVP live:** ~**9–12 months** from Phase 0 start.
- **First real federal filing (partner-transmitted):** ~**18–24 months**, gated by ATS and the filing-season calendar (you can only go live aligned to a season; miss the window and it's a year's wait).
- **Meaningful multi-state coverage:** ~**year 2–3**.
- **Direct IRS transmitter + AI/advisory maturity:** ~**year 3+**.
- **Hard external constraint:** the **tax-season calendar is immovable.** Certification, ATS, and launch all align to the IRS season. Slipping a quarter can mean slipping a *year* of revenue. Plan backward from filing season, every year.

### 16.6 Final verdict
**Viable, valuable, and defensible — *if* sequenced with discipline and capitalized for a multi-year, compliance-led build.** FinnaCalc's existing trusted-calculator audience and year-round engagement are a genuine, under-exploited edge against seasonal incumbents, and the "premium trust, anti-dark-pattern" positioning is timely. The venture fails if it underestimates compliance, rushes the engine, treats security as infrastructure, or tries to become a regulated transmitter before earning a single dollar of user trust. **Build the engine like a bank builds its ledger, treat compliance as a co-founder, partner for transmission first, and monetize complexity and year-round value — not the data, and not a race to free.**

---

*End of document. No implementation is authorized by this proposal; it is a viability and architecture assessment for investor and senior-engineering review. Compliance, e-file, and tax-treatment statements herein are architectural guidance and must be validated by qualified tax counsel and an IRS e-file specialist before any handling of real taxpayer data or filings.*
