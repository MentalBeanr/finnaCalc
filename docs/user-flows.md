# FinnaCalc Tax Platform — User Flows & Page Hierarchy

**Companion to:** `tax-platform-architecture-v2.md`, `database-design.md`, `tax-engine-specification.md`
**Document type:** UX flow design (flows, page hierarchy, state mapping) — no implementation
**Status:** DRAFT FOR REVIEW

> **What this document is.** The end-to-end user journeys for the filing product, expressed as flow diagrams plus the page/route hierarchy that realizes them. Every flow is grounded in the approved architecture: FinnaCalc is **DIY self-prep software** (v2 §2), the engine produces a **live estimate** via incremental recompute (engine-spec §3.5), unsupported facts are **detect-and-declined** before filing (v2 §3.3), the taxpayer **self-signs** via Self-Select PIN with prior-year AGI and IP PIN (v2 §6.5), and bank-account changes pass a **refund-redirection control plane** (v2 §6.4). State transitions reference the **return lifecycle** and **filing state machine** in `database-design.md` §16 / §8.
>
> **Design posture (from v1 §10, refined by v2).** Quiet-luxury, high-trust, anti-dark-pattern: **pricing is shown before emotional commitment**, scope limits are stated honestly, and the SSN is asked for late. **Mobile-first for simple (W-2) returns; responsive desktop-grade for complex** (v2 §10.8).

---

## Diagram legend

```
  [ Page / Screen ]          (rectangle = a route the user lands on)
  ( Action / System step )   (parentheses = system action, no dedicated page)
  < Decision >               (angle brackets = branch point)
  ▶ / │ / └─                 flow direction
  ⟦ state: x ⟧               return/filing state after this step (db §16 / §8)
  ★ live estimate updates    the persistent refund/owed figure recomputes here
  ⚑ audit event              a logged event per database §15
```

---

## Table of Contents

1. [Top-Level Journey Map](#1-top-level-journey-map)
2. [Page / Route Hierarchy](#2-page--route-hierarchy)
3. [Return State ↔ Flow Mapping](#3-return-state--flow-mapping)
4. [Flow: Signup](#4-flow-signup)
5. [Flow: Onboarding](#5-flow-onboarding)
6. [Flow: Tax Interview](#6-flow-tax-interview)
7. [Flow: W-2 Upload](#7-flow-w-2-upload)
8. [Flow: 1099 Upload](#8-flow-1099-upload)
9. [Flow: Deductions & Credits](#9-flow-deductions--credits)
10. [Flow: Review](#10-flow-review)
11. [Flow: Filing](#11-flow-filing)
12. [Flow: Payment](#12-flow-payment)
13. [Cross-Cutting Patterns](#13-cross-cutting-patterns)
14. [Persistent UI Shell](#14-persistent-ui-shell)

---

## 1. Top-Level Journey Map

The spine of the product. Each box is a flow detailed below; the return state advances left to right.

```
 [Marketing /         [Sign  ]   [Onboard- ]   [ Tax Interview ]   [ Review ]   [ File ]   [ Payment ]   [ Status ]
  Calculators ] ─────▶[ up   ]──▶[ ing      ]──▶[ (income →     ]─▶[        ]─▶[      ]─▶[          ]─▶[         ]
   (existing FinnaCalc)  │          │             deductions →    │   │           │           │             │
   "Estimate my refund"  │          │             credits)        │   │           │           │             │
                         │          │                  ★           │   │           │           │             │
                      ⟦draft⟧    ⟦draft⟧          ⟦draft⟧    ⟦ready_to_   ⟦ready_  ⟦signed→   (fee paid;   ⟦accepted
                                                              review⟧    to_file⟧  submitted⟧  refund/due   | rejected
                                                                                              scheduled)    →remediate⟧
            │                                                   │
            └──────── entry: top-of-funnel calculator ──────────┘
                       (the cheapest acquisition channel, v2 §13.2)
```

**Two entry points:**
1. **Calculator → "Estimate my refund"** — the existing FinnaCalc surface is the funnel; a calculation prompts account creation to save it.
2. **Direct "File your taxes"** — a user who already intends to file.

**One honest exit at any time:** save & resume (every flow autosaves; ⟦draft⟧ persists).

---

## 2. Page / Route Hierarchy

```
/                                   Marketing + existing calculators (funnel)
│
├── /sign-up                        Account creation (§4)
├── /sign-in                        Returning user
│
├── /onboarding                     First-run wrapper (§5)
│   ├── /onboarding/welcome           Scope & expectations (honest: what we can/can't file)
│   ├── /onboarding/mfa               MFA setup ("protect your SSN like a bank")
│   ├── /onboarding/year              Choose tax year (binds ruleset, engine-spec §5)
│   └── /onboarding/life-events       Life-event triage → seeds interview graph
│
├── /file/[returnId]                Return workspace shell (persistent rail + live estimate)
│   ├── /interview                    Interview hub (§6)
│   │   ├── /about-you                  Personal info, filing status
│   │   ├── /household                  Spouse, dependents (every-person identity, db §5.2)
│   │   ├── /income                     Income hub
│   │   │   ├── /w2                        W-2 entry/upload (§7)
│   │   │   ├── /1099                      1099 entry/upload (§8)
│   │   │   └── /interest-dividends        1099-INT / 1099-DIV
│   │   ├── /health-coverage            1095-A / Form 8962 (MVP-required, v2 §3.2)
│   │   ├── /deductions                 Deductions (§9)
│   │   └── /credits                    Credits: CTC, EITC, education, childcare, saver's (§9)
│   │
│   ├── /documents                    Secure document vault (upload/manage)
│   ├── /review                       Explainable summary + pricing (§10)
│   ├── /file                         Consent → IP PIN → e-signature (§11)
│   │   ├── /consent                    §7216 + e-sign disclosure
│   │   ├── /identity                   IP PIN + prior-year AGI
│   │   └── /sign                       Self-Select PIN signature
│   ├── /payment                      Fee + refund/balance-due setup (§12)
│   │   ├── /fee                        Filing-fee checkout (PSP)
│   │   └── /refund-or-due              Direct deposit / direct debit (refund-redirection controls)
│   └── /status                       Submission tracking + reject remediation (§11.4)
│
├── /account
│   ├── /account/security             MFA, devices, password
│   ├── /account/returns              All returns across years (multi-year, db §16)
│   └── /account/documents            Cross-return document history
│
└── /support                         Tiered help (self-serve → human)
```

> **Why `/file/[returnId]` is a shell, not a wizard.** A return is non-linear: users jump between income, deductions, and documents, leave and resume across devices. The shell holds the **persistent rail + live estimate** (§14) while sub-routes are the steps. This is the "save-anywhere interview" of v1 §10.2.

---

## 3. Return State ↔ Flow Mapping

Every flow advances the `tax_returns.state` machine (database §16.1). This table is the contract between UX and data.

| Flow | Entry state | Exit state | Key events ⚑ |
|---|---|---|---|
| Signup | — (no return) | — | account.create |
| Onboarding | — | `draft` (return created) | return.create, ruleset bind |
| Interview (income/ded/credits) | `draft` | `draft` | facts.edit (each answer) |
| W-2 / 1099 upload | `draft` | `draft` | doc.upload, doc.scan |
| Review | `draft` | `ready_to_review` → `ready_to_file` | calc.run, scope.check |
| Filing | `ready_to_file` | `signed` → `submitted` | consent.sign, esign, transmit |
| Payment | (during/after file) | — (fee captured) | payment.authorize |
| Status | `submitted` | `accepted` \| `rejected`→remediate | filing.ack, filing.reject |

Filing sub-states (database §8): `built → transmitted → received → validated → {accepted | rejected | imperfect}`.

---

## 4. Flow: Signup

**Goal:** create a secure account with minimal friction; defer SSN. **Trust is the product.**

```
 [Marketing / Calculator result]
        │  "Save my estimate" / "File your taxes"
        ▼
 [ /sign-up ]
   • email + password  (or Google/Apple — deferred per existing auth pages)
   • NO SSN asked here
        │
        ▼
 ( create user )  ⚑ account.create   ⟦ no return yet ⟧
        │
        ▼
 < email verification required? >──yes──▶ ( verify email ) ──┐
        │ no                                                 │
        └───────────────────────────────────────────────────┘
        ▼
 ▶ continue to /onboarding
```

**Design notes**
- **SSN is never collected at signup** (v2 §10.1 progressive profiling). It is asked for at the *household/identity* step, with a "why we need this" affordance.
- Password storage is the managed IdP's job (engine/arch boundary); this flow only orchestrates.
- A user arriving from a calculator carries their estimate context → the first return is pre-seeded with that figure.

---

## 5. Flow: Onboarding

**Goal:** set security posture, set honest expectations, and triage life-events to seed the interview. Creates the `draft` return.

```
 [ /onboarding/welcome ]
   • "Here's what FinnaCalc can file this year" (honest scope, v2 §3.3)
   • "Here's what we can't yet — we'll tell you early if you hit it"
        │
        ▼
 [ /onboarding/mfa ]
   • Set up MFA (WebAuthn/passkey preferred; TOTP fallback)
   • Framed as protection, not friction: "We guard your data like a bank"
        │  ⚑ mfa.enroll
        ▼
 [ /onboarding/year ]
   • Choose tax year  ──▶ ( bind ruleset: jurisdiction=federal, tax_year )  (engine-spec §5)
        │
        ▼
 [ /onboarding/life-events ]
   • Plain-language checklist (NOT form numbers):
     ☐ Had a job (W-2)     ☐ Freelance / gig (1099)
     ☐ Had health insurance from the Marketplace (1095-A)
     ☐ Have kids / dependents   ☐ Paid for college   ☐ Own a home
        │
        ▼
 ( Fact Mediation Layer seeds the interview graph from selected events )  (v2 §4.7)
        │
        ▼
 ( create return )  ⚑ return.create   ⟦ state: draft ⟧
        │
        ▼
 < any selected event is OUT of MVP scope?
   (e.g. "sold a rental", "own a business") >
        │ yes                              │ no
        ▼                                  ▼
 [ detect-and-decline notice ]        ▶ /file/[returnId]/interview
   "FinnaCalc can't file a return with X yet.
    Here's why, and what you can do."          (honest boundary, not a silent failure)
```

**Design notes**
- The **life-event triage drives the interview** — the user never navigates raw form numbers (v1 §10.2).
- **Detect-and-decline happens as early as possible** (here, at triage) so a user with an unsupported situation isn't walked deep into a return that can't be filed (v2 §3.3).
- **1095-A is surfaced at triage** because Form 8962 is MVP-mandatory (v2 §3.2) — omitting it rejects the return.

---

## 6. Flow: Tax Interview

**Goal:** collect facts via a branching, save-anywhere interview with a **continuously updating estimate**. This is the product's spine.

```
 [ /file/[returnId]/interview ]  (hub — shows section progress + live estimate ★)
        │
        ├─▶ [ /about-you ]      filing status, address; ⚑ facts.edit          ★
        │
        ├─▶ [ /household ]      spouse + dependents
        │       • each person → name, DOB, relationship
        │       • SSN collected HERE, into the vault (db §4.2), with "why"   ⚑ vault.write
        │       • is_minor flagged (db §5.2)                                  ★
        │
        ├─▶ [ /income ]         income hub → W-2 (§7), 1099 (§8), INT/DIV
        │                                                                     ★
        ├─▶ [ /health-coverage ] 1095-A entry → drives Form 8962 (v2 §3.2)    ★
        │
        ├─▶ [ /deductions ]     standard vs itemized inputs (§9)              ★
        │
        └─▶ [ /credits ]        CTC, EITC, education, childcare, saver's (§9) ★
                │
                ▼
        ( each answer: facts.edit ⚑ → incremental recompute → estimate ★ )  (engine-spec §3.5)
                │
                ▼
        ( Layer-2 tax-logic validation runs continuously )  (engine-spec §4.2)
                │
                ├── warning/error diagnostic? ──▶ inline, plain-language, actionable
                │
                ▼
        < all required sections complete? >──no──▶ hub shows what's left
                │ yes
                ▼
        ▶ "Review my return" → /review
```

**Interview mechanics**
- **Branching:** the graph (seeded at onboarding) skips irrelevant sections — no kids ⇒ no childcare/CTC questions.
- **Live estimate ★:** every answer triggers incremental recompute (only the dirty subgraph, engine-spec §3.5); the refund/owed pill in the shell updates instantly.
- **Plain-language with jargon-on-tap:** never require form vocabulary; offer it on hover/tap.
- **Continuous validation:** Layer-2 diagnostics (engine-spec §4.2) surface inline as the user types, not in a wall at the end.
- **Detect-and-decline mid-interview:** if an answer introduces an unsupported fact (e.g., checks "I sold stock" → Schedule D), the scope classifier (engine-spec §4.4) raises the decline notice immediately.
- **Autosave:** every `facts.edit` persists ⟦draft⟧; the save indicator (§14) confirms.

---

## 7. Flow: W-2 Upload

**Goal:** get W-2 data in with minimum typing. **MVP: manual entry, with optional upload-to-vault. V2: OCR pre-fill, human-confirmed** (v2 §11).

```
 [ /file/[returnId]/interview/income/w2 ]
        │
        ▼
 < how do you want to add it? >
   │                                  │
   │ "Upload"                         │ "Type it in"
   ▼                                  ▼
 ( drag-drop / mobile camera )    [ manual W-2 form ]
   │  ⚑ doc.upload                   • Box 1 wages, Box 2 withholding,
   ▼                                 •  Box 12 codes, state boxes
 ( virus scan + classify )          • whose W-2 (taxpayer/spouse)
   │  ⚑ doc.scan                      │
   ├── quarantined? ─▶ error: "We couldn't accept this file"   │
   ▼ clean                                                     │
 [ store in vault ]  encrypted, per-object key (db §7)         │
   │  ⚑ doc.store                                              │
   ▼                                                           │
 ┌─ MVP ─────────────────────────┐   ┌─ V2 ──────────────────┐│
 │ show stored doc; user types   │   │ OCR extract → PRE-FILL ││
 │ the boxes manually            │   │ fields → user CONFIRMS ││
 │ (doc is reference only)       │   │ every value (never auto)│
 └───────────────┬───────────────┘   └───────────┬───────────┘│
                 │                                │            │
                 ▼                                ▼            ▼
        ( income_source row: type='w2' )  ⚑ facts.edit   ★ estimate updates
                 │
                 ▼
        < add another W-2? >──yes──▶ (loop)
                 │ no
                 ▼
        ▶ back to /income hub
```

**Design notes**
- **Upload ≠ trust.** Even with V2 OCR, the **user confirms every field that affects the return** — extraction is a suggestion, the confirmed value is what the engine consumes (v2 §11.3).
- **Documents are vaulted** (encrypted, scanned) the moment they land; the bytes never touch logs/analytics (db §7).
- **Mobile camera capture** is a first-class input (the genuine mobile advantage, v2 §10.8).
- **Per-person attribution:** a W-2 is tied to taxpayer or spouse (`income_sources.person_id`, db §5.2).

---

## 8. Flow: 1099 Upload

**Goal:** handle the 1099 family, **respecting MVP scope.** 1099-INT/DIV/G and 1099-R fit MVP; **1099-NEC/Schedule C and 1099-B/Schedule D are detect-and-declined** in MVP (v2 §3) until the freelancer/investor engine ships.

```
 [ /file/[returnId]/interview/income/1099 ]
        │
        ▼
 < which 1099 type? >
   ├── 1099-INT / 1099-DIV ───────────▶ [ interest-dividends entry ]  (in MVP scope)
   │                                         │ upload or manual (same pattern as §7)
   │                                         ▼  ⚑ facts.edit   ★
   │                                    ( income_source: type='1099_int'|'1099_div' )
   │
   ├── 1099-R (retirement) ───────────▶ [ retirement income entry ]   (in MVP scope)
   │
   ├── 1099-NEC (freelance) ──────────▶ [ detect-and-decline notice ]
   │       "Self-employment income needs Schedule C, which FinnaCalc
   │        can't file yet. Here's what to do in the meantime."
   │
   └── 1099-B (investment sales) ─────▶ [ detect-and-decline notice ]
           "Investment sales need Schedule D — coming soon.
            We won't let you file an incomplete return."
        │
        ▼
 ( upload path identical to §7: scan → vault → confirm )  for in-scope types
        │
        ▼
 ▶ back to /income hub
```

**Design notes**
- **Scope honesty at the type choice.** The user learns *immediately* that NEC/B aren't supported — not after entering data (v2 §3.3). The decline notice is a **trust feature**, not a dead end: it explains the boundary and the alternative.
- This flow is where the **roadmap pressure** is most visible: the high-value freelancer/investor personas (v1 §3) are exactly the declined paths, and exactly what v2's later phases unlock (v2 §8.4). The flow is built so those types "light up" when the engine scope expands — no UX rewrite, just a manifest change (engine-spec §4.4).

---

## 9. Flow: Deductions & Credits

**Goal:** capture deductions/credits; **let the engine choose standard vs itemized and explain why.**

```
 [ /file/[returnId]/interview/deductions ]
        │
        ▼
 ( info banner: "We'll automatically use whichever saves you more." )
        │
        ▼
 [ deduction inputs ]
   • mortgage interest   • property taxes   • charitable
   • SALT (capped $10k w/ property, engine primitive applyCap)
   • medical (7.5% AGI floor, applyFloor)   • student-loan interest (above-the-line, $2,500 cap)
        │  each: ⚑ facts.edit  → incremental recompute  ★
        ▼
 ( engine node: chooseMax(standard, itemized) )  (engine-spec §2.4)
        │
        ▼
 [ inline result strip ]
   "Standard deduction ($14,600) beats your itemized ($9,200) — we'll use standard.
    [why?] → trace explanation w/ citation"  (engine-spec §8)
        │
        ▼
 [ /file/[returnId]/interview/credits ]
   • dependents → CTC/ACTC (Sch 8812)      • EITC (Sch EIC, qualifying-child logic)
   • education (8863 AOTC/LLC)              • childcare (2441)   • saver's (8880)
        │  each: ⚑ facts.edit  ★
        ▼
 ( Layer-2 validation: e.g. "can't claim AOTC and LLC for same student" )  (engine-spec §4.2)
        │
        ▼
 ▶ "Review my return" → /review
```

**Design notes**
- **The engine decides, the UX explains.** Standard-vs-itemized is `chooseMax` (engine-spec §2.4); the user sees the *outcome and the reason* (trace, engine-spec §8), never a manual toggle that risks a wrong choice.
- **Caps/floors are engine primitives**, not UI math — the SALT $10k cap and 7.5%-AGI medical floor live in the engine (engine-spec §2.4), so the displayed number always matches what gets filed (the A4 reconciliation guarantee).
- **Credit eligibility diagnostics** surface inline (engine-spec §4.2) before review.

---

## 10. Flow: Review

**Goal:** an explainable, anomaly-aware summary with **transparent pricing before commitment.** Advances to `ready_to_file`.

```
 [ /file/[returnId]/review ]   ⟦ state: draft → ready_to_review ⟧
        │
        ▼
 ( full calculation run + result-invariant validation )  (engine-spec §4.3)  ⚑ calc.run
        │
        ├── result tripwire fired? ──▶ safe-state error (§13.2); on-call alerted; NO number shown
        ▼ ok
 [ summary ]  (reads form_line_values — the single source, db §6.2)
   Total income → AGI → Deduction (std/itemized + why) → Taxable income
   → Tax → Credits → Withholding → ⟦ Refund $X  |  You owe $X ⟧
   each line: [explain] → trace + citation
        │
        ▼
 [ anomaly surfacing ]
   "Your refund is much larger than last year — here's why / did you mean this?"  (v1 §10.3)
        │
        ▼
 ( scope re-check + MeF-rule pre-validation )  (engine-spec §4.5)
        │
        ├── unsupported fact slipped in? ──▶ detect-and-decline
        ├── would-reject diagnostic?      ──▶ "Fix before filing: <plain language>"
        ▼ clean
 [ transparent pricing ]   ⟦ state: ready_to_file ⟧
   "Federal: Free. State: $X. No surprises."  (anti-dark-pattern, v2 §13 / v1 §10.3)
   • pricing shown HERE, before the user is emotionally committed
        │
        ▼
 < ready to file? >──"not yet"──▶ back to interview (still ⟦ready_to_file⟧, editable)
        │ yes
        ▼
 ▶ /file  (consent → identity → sign)
```

**Design notes**
- **Pricing precedes commitment.** Deliberately the opposite of TurboTax's late-stage upsell — the brand bet (v2 §13.2). The price is on the review page, not sprung at the end.
- **Explainability is everywhere:** every figure has an `[explain]` backed by the engine trace (engine-spec §8); "why standard vs itemized" is a first-class answer.
- **MeF-rule pre-validation** (engine-spec §4.5) turns would-be IRS rejects into fix-it-now diagnostics — the single biggest reducer of post-filing reject pain.

---

## 11. Flow: Filing

**Goal:** the taxpayer **self-signs** (DIY, v2 §2) and the return is transmitted. This is the regulated heart.

### 11.1 Consent → Identity → Signature

```
 [ /file/[returnId]/file ]   ⟦ state: ready_to_file ⟧
        │
        ▼
 [ /file/consent ]
   • §7216 consent(s) — separately signed, mandated format (v2 §9.3 / db §10.1)
   • e-sign disclosure
        │  ⚑ consent.sign  (immutable, db §10.1)
        ▼
 [ /file/identity ]
   • IP PIN entry (if the taxpayer/dependent has one) → vault (db §4.2)   ⚑ vault.write
   • prior-year AGI (from carryforward ledger, db §6.4; rate-limited, never echoed)
        │
        ▼
 ( verify prior-year AGI / prior-year PIN )  (e-signature auth, v2 §6.5)
        │
        ├── mismatch ──▶ "That AGI doesn't match IRS records" + retry (capped) + help
        ▼ match
 [ /file/sign ]
   • Self-Select PIN signature (taxpayer; + spouse if MFJ)
        │  ⚑ esign  (immutable, db §10.2)   ⟦ state: signed ⟧
        ▼
 ▶ payment (§12) if a fee/balance applies, else → transmit
```

### 11.2 Transmission

```
 ( build MeF payload from form_line_values )  (single source, v2 §4.5)
        │
        ▼
 ( pre-transmit reconciliation: engine → PDF → MeF must match to the cent )  (v2 §7.3)
        │
        ├── mismatch ──▶ BLOCK transmit; alert on-call (never file a divergent return)
        ▼ match
 ( decrypt SSN/bank from vault — MeF serializer, the only filing-time consumer )  ⚑ vault.decrypt (v2 §6.2)
        │
        ▼
 ( transmit via partner transmitter )  ⟦ filing: built → transmitted ⟧   ⚑ transmit
        │
        ▼
 ▶ /status
```

### 11.3 Status tracking & acknowledgement

```
 [ /file/[returnId]/status ]
   ⟦ filing: transmitted → received → validated → ??? ⟧   (per-jurisdiction, db §8)
        │
        ├──▶ ⟦ accepted ⟧   "Your federal return was accepted." ⚑ filing.ack  + notification
        ├──▶ ⟦ imperfect ⟧  accepted-with-note; surfaced plainly
        └──▶ ⟦ rejected ⟧   → reject remediation (§11.4)
```

### 11.4 Reject remediation loop

```
 ⟦ rejected ⟧  (reject_codes, db §8.1)
        │
        ▼
 [ remediation screen ]
   • translate IRS reject code → plain language (db §8.3 reject_remediations)
     e.g. IND-031 → "The prior-year AGI didn't match. Let's re-enter it."
        │
        ▼
 ( user fixes the specific fact ) ──▶ re-sign if needed ──▶ rebuild ──▶ retransmit
        │  (NEW filings row per attempt, db §8 — attempts are append-only)
        ▼
 ▶ back to /status   (48-hour retransmission window honored, v2 §7.2)
```

**Design notes**
- **DIY self-signature** via Self-Select PIN — no preparer signs (the v2 §2 legal-identity decision, realized in UX).
- **The reconciliation gate is in the flow**: a return whose engine/PDF/MeF disagree **cannot transmit** (v2 §7.3) — the user is protected from filing a number that doesn't match what they reviewed.
- **Rejects are conversations, not codes**: the remediation screen translates the reject and routes the user to the exact fix (v1 §10.4), then rebuilds a fresh attempt.
- **Vault decryption is audited and minimal**: only the MeF serializer decrypts, only at transmit, with a pre-decrypt audit event (v2 §6.2 / db §15).

---

## 12. Flow: Payment

**Goal:** collect any **filing fee** (PSP) and set up **refund deposit** or **balance-due debit** (IRS-sanctioned) — two completely separate money flows (v2 §4.3), with the **refund-redirection control plane** on bank changes (v2 §6.4).

```
 [ /file/[returnId]/payment ]
        │
        ├─────────────────────────────┬──────────────────────────────┐
        ▼                             ▼                              ▼
 [ /payment/fee ]            [ /payment/refund-or-due ]      (if federal is free &
   • filing fee (state $X)     < refund or balance due? >      no refund/debit setup
   • PSP checkout (Stripe)       │                │             needed → skip)
   • idempotency key             │ refund         │ balance due
        │ ⚑ payment.authorize    ▼                ▼
        │                  [ direct deposit ]  [ direct debit ]
        │                    • routing+acct      • routing+acct + date
        │                       │  → VAULT (db §9.1), HMAC for velocity checks
        │                       ▼
        │                  ( refund-redirection control plane, v2 §6.4 ):
        │                    • step-up auth (WebAuthn re-assert)        ⚑
        │                    • out-of-band "did you do this?" notice    ⚑
        │                    • cooling-off window before transmit
        │                    • velocity / ownership checks
        │                       │
        │                       ├── high risk ──▶ fraud_review queue (db §10.3); HOLD transmit
        │                       ▼ cleared
        └───────────────┬───────┘
                        ▼
                 ▶ proceed to transmit (§11.2)
```

**Design notes**
- **Two money rails, never mixed.** The filing fee goes through a normal PSP; the IRS refund/balance-due uses sanctioned ACH/direct-debit (v2 §4.3) — different `payments.kind`, different processor (db §9.2).
- **Bank-account entry is the #1 fraud control point** (v2 §6.4). Adding/changing an account triggers step-up auth, an out-of-band notification, a cooling-off window, and velocity/ownership checks; high-risk routes to manual review and **holds transmission** — directly defeating the refund-redirection attack (review S3).
- **Bank numbers are vaulted** (db §9.1); the core DB holds only the control-plane metadata + token.
- **Anti-dark-pattern:** if federal is free and no banking setup is needed, the user is **not** forced through an upsell — payment is skipped (v2 §13).

---

## 13. Cross-Cutting Patterns

### 13.1 Save & resume (everywhere)
Every `facts.edit` autosaves ⟦draft⟧; the shell shows a save indicator (§14). A user can leave at any step and resume on any device — the interview graph + facts are server-state (db §5), not client-only.

### 13.2 Error handling (two classes, v1 §10.4)
```
 < error class? >
   ├── user-fixable (missing/implausible field, failed validation)
   │      ▶ inline, gentle, actionable, with citation — fix in place
   └── system/engine (tripwire, non-convergence, transmit failure)
          ▶ NEVER show a raw error
          ▶ "We saved your progress — nothing was lost." safe state
          ▶ alert on-call (engine-spec §9); user can retry/contact support
```

### 13.3 Detect-and-decline (the honest boundary)
Triggered at the **earliest** point an unsupported fact appears (onboarding triage → income type → mid-interview → review re-check). Always: *what* isn't supported, *why*, and *what to do instead*. It is a trust feature, surfaced before the user invests effort (v2 §3.3).

### 13.4 Mobile vs. desktop (v2 §10.8)
- **Mobile-first** for the simple W-2 path: camera document capture, short steps, thumb-reachable actions.
- **Responsive desktop-grade** for denser screens (multiple dependents, review with many lines). No "mobile-only" amputation of complex needs.

### 13.5 Accessibility (WCAG 2.2 AA, v2 §10.9)
Full keyboard nav, screen-reader-correct form semantics, accessible error messaging, sufficient contrast — a high-trust financial brand cannot ship inaccessible tax forms. Applies to every flow above.

### 13.6 Support escalation (v1 §10.7)
Self-serve help → guided in-product help → human support. Agents operate through the **audited, least-privilege admin console** (db §11), never raw data; sensitive views require four-eyes (db §11.2).

---

## 14. Persistent UI Shell

The `/file/[returnId]` shell wraps every interview/review/file/payment sub-route with constant scaffolding:

```
 ┌───────────────────────────────────────────────────────────────────────────┐
 │  FinnaCalc        TY2024 Federal Return            [ ⟳ Saved ]   [ Help ]   │  ← top bar: save indicator
 ├──────────────┬────────────────────────────────────────────────────────────┤
 │  PROGRESS    │                                                             │
 │  RAIL        │              ( active sub-route content )                   │
 │              │                                                             │
 │ ● About you  │              e.g. /interview/income/w2                      │
 │ ● Household  │                                                             │
 │ ○ Income     │                                                             │
 │ ○ Health     │                                                             │
 │ ○ Deductions │                                                             │
 │ ○ Credits    │                                                             │
 │ ○ Review     │                                                             │
 │              │                                                             │
 ├──────────────┴────────────────────────────────────────────────────────────┤
 │   ★  Estimated refund: $1,240   [explain]              [ Save & exit ]      │  ← live estimate pill
 └───────────────────────────────────────────────────────────────────────────┘
```

**Shell elements**
- **Progress rail** — sections with completion state; non-linear navigation (jump anywhere).
- **Live estimate pill ★** — the refund/owed figure, recomputed incrementally on every answer (engine-spec §3.5), with `[explain]` → trace. This is FinnaCalc's signature continuity-of-feedback (v1 §10.2), carried from the existing calculators.
- **Save indicator** — confirms autosave of ⟦draft⟧ (§13.1).
- **Help** — entry to tiered support (§13.6).

> The shell is what makes the return feel **calm and in-control** (the quiet-luxury posture): the user always sees where they are, what they'll get, and that nothing is lost.

---

*This is UX architecture, not implementation. Flows reference the approved architecture, data model, and engine spec; any e-file, §7216, IP-PIN, or signature specifics must be confirmed with qualified tax counsel and an IRS e-file specialist before build. No code or visual design is specified by this document.*
