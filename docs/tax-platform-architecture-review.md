# Critical Review — FinnaCalc Tax Platform Architecture

**Reviewer role:** Former TurboTax Principal Engineer (consumer tax engine, e-file, and forms platform)
**Document under review:** `docs/tax-platform-architecture.md`
**Review posture:** Adversarial. The job here is to find what kills the product in production season, not to validate the proposal.
**Verdict in one line:** *Strong strategy memo, dangerously optimistic engineering plan.* The business sequencing (partner-first, non-filing MVP, premium positioning) is genuinely good. The **engineering model of how tax actually computes is wrong in ways that will require an architectural rewrite**, the compliance section confuses *who FinnaCalc legally is*, and several **mandatory, return-rejecting requirements are simply absent**.

---

## How to read this review

Findings are grouped by the requested categories and rated:

- 🔴 **Blocker** — will cause wrong filings, rejected returns, a breach, or a failed IRS certification. Must be fixed before real filings.
- 🟠 **Major** — will force a rewrite or a season-killing scramble if discovered late.
- 🟡 **Moderate** — real gap, recoverable, but underestimated in the doc.

Each finding cites the section it critiques and gives a concrete remediation. I am deliberately harsh; treat the praise as load-bearing precisely because there is so little of it.

### What the document gets right (so we don't throw it out)
- Partner-transmitter-first sequencing (§9.9) — correct, and the single best decision in the doc.
- Non-filing MVP that still carries full Safeguards/§7216 weight (§9.8) — correct and frequently missed.
- Year-versioned, isolated engine *as a goal* (§6) — right instinct.
- Inverted unit economics acknowledged (§13.2) — most proposals miss this.

Everything below is what's wrong.

---

## 1. Architectural Weaknesses

### 🔴 A1. The tax engine pipeline is modeled as a linear DAG. Real tax computation is circular.
**Critique (§6.4, §6.6).** The "ordered, append-only sequence of stages" assumes income → AGI → deductions → tax flows one direction. It does not. Tax has **genuine circular dependencies** that require iterative fixed-point solving:
- **Taxable Social Security** depends on AGI, but is *part of* AGI (the worksheet is self-referential).
- **IRA deduction** depends on MAGI, which depends on the IRA deduction.
- **½ self-employment-tax deduction** lowers AGI, which changes AGI-dependent phase-outs (student loan interest, IRA, education credits, Premium Tax Credit), which can change other above-the-line items.
- **Passive activity losses, the §199A QBI deduction, and the taxable-income limitation** form a mutual dependency.
- **IRA deduction ↔ Saver's Credit ↔ taxable SS** can form a three-way loop.

A single forward pass produces **wrong numbers** on these. The engine must be a **dependency graph with iterative convergence** (compute, detect changed inputs, recompute to a fixed point), not a pipeline.

**Why this is a blocker:** This is not a feature you bolt on later — it is the engine's evaluation model. Building the linear pipeline first means rewriting the core once you hit the first SS-benefits-plus-IRA return (i.e., a huge fraction of real filers). **Remediation:** Model the engine as a **worksheet/line dependency graph with a fixed-point evaluator** from day one. Budget the convergence semantics, cycle detection, and ordering as core engine work in Phase 2, not Phase 5.

### 🔴 A2. The engine models abstract "stages," but the IRS source of truth — and the MeF payload — is **forms and lines.**
**Critique (§6.2, §6.6).** Stages like `05-tax-before-credits.ts` are an engineer's mental model, not the legal computation. The IRS defines tax via **forms, schedules, and worksheets with line numbers and inter-form data flows** ("Schedule 1 line 10 flows to 1040 line 8"). Your golden fixtures (§6.6) come "from IRS examples" — but IRS examples *are* form-line walkthroughs. If your internal model isn't form-line-addressable, every fixture requires a lossy translation, and **audit-grade explainability (the §6 selling point) becomes unverifiable** because you can't say "this number is 1040 line 16."

**Remediation:** Model computation in terms of **forms, lines, and worksheets** as first-class entities, with the calculation graph expressed as line-to-line dependencies. This is how production tax engines are actually built, and it's what makes the engine reconcile with both the printed 1040 and the MeF XML (see A4).

### 🟠 A3. "Stateless engine, one input → one result" ignores **carryforwards** — a return is not independent across years.
**Critique (§6.1, §7).** The engine is "pure, no prior state." But real returns consume **prior-year carryforwards**: capital-loss carryover, NOL, AMT credit carryforward, passive-activity-loss carryover, charitable-contribution carryover, §179 carryover, foreign-tax-credit carryover. These are *inputs* derived from the prior year's *computed* result, and this year's return *generates* next year's carryforwards. The data model (§7) has no carryforward entity, and the engine spec treats years as fully independent.

**Remediation:** Add a **carryforward ledger** to the data model and make prior-year carryforwards an explicit engine input and output. This also means "amended prior year" can cascade into later years — design for it.

### 🟠 A4. No architecture for the **three-way reconciliation** between engine result, printed PDF (1040 + schedules), and MeF XML.
**Critique (§4.3, §6).** The doc has an engine producing numbers and a filing gateway producing MeF XML, as if they're the same. They are three representations that **must agree to the penny**: (1) the engine's computed values, (2) the human-readable PDF the user signs/keeps, (3) the MeF XML the IRS validates against thousands of business rules. Divergence between these is a top source of rejects and of "the PDF says X but you filed Y" liability. There is no component, invariant, or test strategy for guaranteeing they reconcile.

**Remediation:** Make **form-line values the single source** that drives both the PDF renderer and the MeF serializer, and add a reconciliation test that diffs engine → PDF → MeF for every golden fixture.

### 🟠 A5. The interview ↔ engine ↔ forms mapping is hand-waved into two services.
**Critique (§4.3, §10.2).** "Returns Service owns what the user said; engine owns what the law computes." Fine — but there are **three representations** (life-event answers → tax facts → form-line values) and **two lossy mapping layers** between them. This mapping is where the overwhelming majority of tax-software engineering effort and bugs actually live (it's thousands of person-years at TurboTax). The doc allocates it roughly one sentence.

**Remediation:** Treat the **fact-mapping layer as a named, first-class subsystem** with its own tests and ownership. It is bigger than the engine itself.

### 🟡 A6. No data-import architecture, yet the target personas are import-dependent.
**Critique (§2, §3.4, §11).** The high-value personas are Investor (1099-B with hundreds of lots) and Freelancer/SMB. For these users, **manual entry is a non-starter** and import is table stakes: brokerage 1099 import, payroll/W-2 import, prior-year import from competitors. The doc lists "prior-year import" as a nice-to-have and never mentions brokerage/payroll import as architecture. You cannot win the investor segment (the doc's stated profit center) on hand-keying 400 transactions.

**Remediation:** Promote **financial-data import** to a core subsystem on the roadmap, with its own security/compliance review (you're ingesting third-party financial feeds).

---

## 2. Security Risks

### 🔴 S1. The "SSN never leaves the vault" invariant is **violated by filing itself** — and the doc asserts it anyway.
**Critique (§4.4).** Invariant: "Raw SSNs/TINs never enter the core RDBMS, logs, analytics, *or notifications* — only the PII Vault holds them." But the **MeF payload requires the SSN in cleartext**, the **printed 1040 shows it**, and **direct-deposit/direct-debit bank numbers** ride in the return. So the SSN (and taxpayer/spouse/dependent SSNs and bank account numbers) **must be decrypted and flow through the filing gateway and the PDF renderer**. The doc's own invariant is internally inconsistent and gives a false sense of containment.

**Remediation:** Replace the absolute invariant with a **documented, minimized, audited decryption path**: exactly which components may request vault decryption, under what authz, with mandatory audit and short-lived plaintext. Threat-model the filing gateway and PDF renderer as PII-handling components (they are).

### 🔴 S2. Dependent and spouse SSNs — including **minors'** — are unaddressed.
**Critique (§7, §8).** A return contains SSNs for spouse and *each dependent*. Children's SSNs are the most damaging identity-theft target that exists (clean credit files, undetected for years). The data model and security section speak only of "the user's SSN." This **multiplies the crown-jewel footprint** and has specific implications (you're storing minors' PII → heightened obligations).

**Remediation:** Model **every person on the return** as a vault-protected identity; explicitly address minors' data in retention, access, and breach-notification planning.

### 🔴 S3. The refund-redirection attack (account takeover → change bank info → steal refund) is the defining tax fraud and is only treated generically.
**Critique (§8.11, §8.1).** The doc lists SIRF and ATO generically. The **specific, high-frequency attack** is: compromise an account (or open one with a stolen identity), enter a *legitimate* victim's data, and route the refund to an attacker-controlled account — or take over a real account late in the flow and **swap the direct-deposit bank account** right before filing. Bank-info changes near filing are the critical control point and aren't called out.

**Remediation:** Step-up auth + cooling-off + notification + velocity checks **specifically on direct-deposit/bank-account changes**, and bank-account ownership verification before refund routing.

### 🟠 S4. No e-signature / Self-Select PIN / prior-year-AGI authentication model.
**Critique (§8, §10.6).** IRS e-file authenticates the taxpayer's signature via **Self-Select PIN with prior-year AGI** (or Form 8879 for ERO-signed). This is both a security mechanism and a compliance requirement, and it's a known fraud surface (prior-year AGI is guessable/phishable). The doc's auth section never mentions it.

**Remediation:** Design the **e-signature/PIN flow** and prior-year-AGI handling explicitly, including the IP-PIN path (S5).

### 🟠 S5. IP PIN (Identity Protection PIN) is not supported.
**Critique (§7, §10).** Millions of taxpayers (all prior identity-theft victims, plus opt-ins) have an IRS-issued **IP PIN that is mandatory on the return** — omitting or mis-entering it **rejects the return**. It's a sensitive, per-year secret. Absent from data model and flows.

**Remediation:** Add IP PIN as a vault-protected, per-year field with its own UX and reject handling.

### 🟡 S6. Crypto-shredding, key residency, and backup data residency unspecified.
**Critique (§8.3, §8.7).** Good envelope encryption, but no mention of **crypto-shredding** for right-to-delete-vs-retention reconciliation, where keys/HSMs physically reside, or where encrypted backups live (data-residency and cross-border concerns for a US tax product).

---

## 3. Compliance Gaps

### 🔴 C1. The document never decides **what FinnaCalc legally is** — DIY self-prep software or a preparer/ERO. This ambiguity invalidates large parts of §9.
**Critique (§9 throughout).** This is the foundational error. "DIY self-prep software" (TurboTax-style: the *taxpayer* self-prepares and self-signs) and a "**paid preparer / ERO**" (acts on behalf of the taxpayer, signs as preparer) are **different regulated entities with different obligations**:
- DIY software is **not** subject to preparer due-diligence penalties (Form 8867 EITC due diligence), PTIN requirements, or Form 8879 ERO retention — because there is no paid preparer.
- An ERO/preparer **is** subject to all of the above, plus §6695 penalties.

The doc mixes both worlds — it invokes EFIN/ERO suitability (preparer concepts) while describing a self-serve product (DIY). **You cannot scope compliance until this is decided.** The competitors named are DIY self-prep; if FinnaCalc is DIY, half of §9's framing is wrong; if it's a preparer, §9 *understates* the burden (8867, PTIN per preparer, 8879).

**Remediation:** State explicitly that FinnaCalc is **DIY self-prep software** (the only model consistent with the personas and competitors), then re-derive the compliance obligations from that — they differ materially from what's written.

### 🔴 C2. Form 8962 / ACA Premium Tax Credit reconciliation is missing — and its absence makes "simple W-2 returns" reject.
**Critique (§2.1, §6).** If a filer (or anyone on the return) had **Marketplace health insurance** and received advance premium tax credit, the return **must include Form 8962** reconciling it against Form 1095-A. **The IRS rejects the return without it.** A "simple W-2 filer" who bought ACA coverage is *not* simple and is extremely common. The MVP's "simple federal" scope silently excludes a large slice of real filers and will produce a wall of rejects if shipped as-described.

**Remediation:** Either include 8962/1095-A in the MVP engine scope or **detect-and-decline** those returns explicitly. Do not discover this in production.

### 🟠 C3. The MeF acknowledgement lifecycle is oversimplified to "accepted/rejected."
**Critique (§4.3, §7, §10.4).** Real e-file has: federal ack **separate** from each state ack; **linked vs. unlinked** Fed/State submissions; **"Imperfect Return"** acceptance; **transmission vs. validation vs. acknowledgement** as distinct stages; and the **business-rule reject corpus is thousands of codes**, not a handful. The `filings` table and reject UX assume a binary outcome.

**Remediation:** Model the **full submission state machine** (transmitted → received → validated → acked, per jurisdiction) and plan reject-code remediation as a large, ongoing content effort.

### 🟠 C4. Mandatory retained-record artifacts (Form 8879 / 8453) and EITC due diligence (8867) are unaddressed — *if* FinnaCalc is a preparer (see C1).
**Critique (§9.6).** Retention is described generically ("multi-year"). If FinnaCalc is an ERO, it **must retain Form 8879** for the prescribed period and meet **EITC/CTC/AOTC due-diligence (Form 8867)** with **$600+/failure penalties**. If it's DIY, these don't apply — which is exactly why C1 must be resolved first.

### 🟠 C5. State complexity is understated: part-year, nonresident, and credit-for-taxes-paid-to-other-states.
**Critique (§9.5, §2.3).** "States are N integrations" undersells it. The real explosion is **part-year and nonresident returns**, **multi-state allocation/apportionment**, **reciprocity agreements**, and **credit for taxes paid to other states** (which couples states together — you can't compute State A in isolation when there's a State B credit). A remote freelancer or a person who moved mid-year hits this immediately.

**Remediation:** Scope state support as **resident-only first**, explicitly defer part-year/nonresident/multi-state, and recognize inter-state credits as a coupling that breaks the "each state is independent" assumption.

### 🟡 C6. §7216 consent specifics, IRS MeF "shutdown/cutover," and Refund Transfer products omitted.
**Critique (§9.3, §12, §13).** (a) §7216 consents have **mandated formats and separate signed consents** (Rev. Proc. 2013-14) — "consent flows" understates it. (b) The IRS MeF system has an **annual shutdown/cutover** (late Nov–Jan) during which **you cannot file** — a hard availability constraint absent from the scalability and ops plans. (c) **Refund Transfer / "pay with your refund"** is a major competitor revenue line *and* a heavily bank-regulated product; the revenue model neither includes nor consciously rejects it.

---

## 4. Scalability Concerns

### 🔴 SC1. "Scale to near-zero off-season" is false for the data tier and oversold for compute.
**Critique (§12.5, §16.3).** Compute can scale down; **data cannot**. Prior-year returns must stay **online year-round** for amendments, the **October 15 extension peak**, IRS notices arriving years later, and users pulling returns for mortgage/loan applications. Treating off-season cost as ~zero is a budgeting error that will surprise finance.

**Remediation:** Separate the cost model into **elastic compute** (scales down) and **always-on encrypted data** (does not). Plan tiered storage, not shutdown.

### 🟠 SC2. Per-keystroke full-return recompute at 1M users is a real cost/latency problem, not "horizontal scaling solves it."
**Critique (§10.2, §12.6).** The "continuous live estimate" recomputing a **pure-function full 1040 + state** on every answer is elegant and **expensive**. A full multi-form, multi-state, iterative-convergence (see A1) recompute per keystroke, for millions of concurrent users during peak, is exactly why production engines use **incremental/memoized calc graphs** (recompute only the affected subgraph). The doc's purity makes incremental recompute *harder*, not easier.

**Remediation:** Design the calc graph for **incremental, memoized evaluation** (dirty-tracking on the dependency graph). Purity is fine; full recompute-on-change is not.

### 🟠 SC3. IRS-side throughput limits and the second (October) peak are missing.
**Critique (§12.2–12.3).** You are throttled by **IRS MeF capacity and maintenance windows**, not just your own infra — you cannot "autoscale" past the IRS. And the **Oct 15 extension deadline** plus year-round amendments/notices are a sustained long tail the capacity plan ignores.

**Remediation:** Model the **IRS as a rate-limited external dependency** with queue/backpressure, and plan for **two peaks** (April, October) plus a long tail.

### 🟡 SC4. Partition-by-tax_year doesn't shard the hot data.
**Critique (§12.2).** During season, **the current-year partition is the hot partition** — partitioning by year leaves all the load on one partition. You need **user-based sharding** for the current-year working set, not just temporal partitioning.

---

## 5. Unrealistic Assumptions

### 🔴 U1. The "simple" MVP scope is narrower than real-world "simple," so the 18–24-month-to-filing timeline is optimistic.
**Critique (§2.1, §16.5).** "Simple W-2 + standard deduction + common credits" still requires, to not reject in production: **EITC** (with its own qualifying-child logic and due-diligence implications), **CTC/ACTC** (refundable portion, phase-outs), **education credits** (8863), **ACA/8962** (C2), **Self-Select PIN/prior-year AGI** (S4), and the **full reject-remediation loop**. That's most of an individual-return engine. The doc's MVP is sized like a calculator; the real "simple return" is most of a 1040.

**Remediation:** Re-scope and re-estimate the MVP against **what the IRS will actually accept**, not against "W-2 + standard deduction."

### 🟠 U2. The partner transmitter removes *less* than the doc claims.
**Critique (§9.9, §16.6).** A partner/service bureau removes **MeF transmission plumbing**. It does **not** remove: the requirement that **your software** passes IRS certification/ATS for the forms you support, your **§7216 and Safeguards** obligations, your **fraud-prevention** duties, or your need for an EFIN if you act as an ERO. "Converts the regulated gate into a vendor integration" is half-true and will create a planning gap if taken literally.

**Remediation:** Enumerate precisely what the partner does and does **not** absorb (it's the transport, not the certification or the regulatory posture).

### 🟠 U3. Cost/staffing for the engine, forms, and the annual update cycle are light by an order of magnitude over time.
**Critique (§16.3–16.4).** $0.6–1.5M for "engine + MVP" can build a narrow federal calculator, not a form-complete, importing, e-signing, state-capable product. The **annual forms/content update** is treated as "a line item"; in reality multi-state forms coverage is a **standing content organization** (TurboTax runs hundreds of people on forms/content). Even at startup scale, year-2+ forms maintenance across states is a sustained 7-figure annual cost, not a seasonal sprint.

**Remediation:** Separate **"narrow federal MVP"** cost from **"competitive product"** cost, and model forms/content as a **permanent team**, not a project.

### 🟡 U4. "Golden fixtures from IRS examples" treats the test corpus as a known quantity. It's a multi-year asset.
**Critique (§6.6, §5).** IRS examples are sparse and don't cover the **combinatorial interaction space** (the bugs live in interactions: SS + IRA + QBI + PTC simultaneously). Real validation cross-checks **thousands of prepared returns** against other software and the IRS ATS scenarios. Underestimating this underestimates the whole accuracy program.

### 🟡 U5. The "premium/anti-dark-pattern" moat is asserted, not validated — and the unit economics are inverted.
**Critique (§13.2, §16.6).** Intuit's dark patterns exist because **they convert**; "honest pricing" has historically *lost* the W-2 conversion war (those users go free). The doc concedes inverted economics but doesn't follow it to the brutal conclusion: **the cheap-to-serve users (W-2) won't pay, and the only users who pay (investor/SMB) are the most expensive to build for.** The premium thesis is a real bet, but it's a bet, and the doc reads it as a strategy.

---

## 6. Missing Requirements (consolidated checklist)

Mandatory or competitively-required items absent from the architecture:

**Return-rejecting if missing (🔴):**
- [ ] **Form 8962 / 1095-A** ACA reconciliation (C2)
- [ ] **IP PIN** support (S5)
- [ ] **Self-Select PIN / prior-year-AGI** e-signature (S4)
- [ ] **Iterative-convergence engine** for circular calcs (A1)

**Architecturally foundational (🟠):**
- [ ] **Carryforward/carryback ledger** (cap loss, NOL, AMT credit, PAL, charitable) (A3)
- [ ] **Form-line model** + **engine/PDF/MeF reconciliation** (A2, A4)
- [ ] **Financial-data import** (brokerage 1099-B, payroll/W-2, prior-year) (A6)
- [ ] **Amended return (1040-X)** lifecycle — "return is mutable after acceptance"
- [ ] **Underpayment penalty (Form 2210)** for the freelancer persona (named in UX, absent from engine)
- [ ] **Multi-state coupling**: part-year, nonresident, credit-for-other-state-taxes (C5)
- [ ] **Identity verification (IDV/KYC)** vendor integration for fraud (mentioned, not designed)

**Operational / correctness (🟠):**
- [ ] **"We filed N wrong returns" runbook** — mandatory disclosure, mass amendment, penalty reimbursement. This is an *existential operational scenario* and there is no plan for it.
- [ ] **Aggregate correctness monitoring** — statistical anomaly detection on refund distributions to catch *wrong-but-plausible* engine output (the "result tripwires" in §6.5 only catch impossible values, not subtly wrong ones).
- [ ] **Support co-browse with PII redaction** — "see what the user sees" without violating least privilege.

**Product/market (🟡):**
- [ ] **Spanish-language** support (large filer population; competitors offer it).
- [ ] **Accuracy-guarantee financial reserving** and the **calc-error vs. user-error attribution** process (listed as revenue, not engineered as a liability).
- [ ] **Refund Transfer** decision — include or consciously reject (C6).

---

## 7. Severity Summary

| # | Finding | Category | Severity |
|---|---|---|---|
| A1 | Linear pipeline can't model circular tax calcs | Architecture | 🔴 Blocker |
| A2 | Stage model diverges from form-line source of truth | Architecture | 🔴 Blocker |
| C1 | DIY-software vs. preparer/ERO never decided | Compliance | 🔴 Blocker |
| C2 | Form 8962/ACA missing → returns reject | Compliance | 🔴 Blocker |
| S1 | "SSN never leaves vault" invariant is false | Security | 🔴 Blocker |
| S2 | Spouse/dependent/minor SSNs unmodeled | Security | 🔴 Blocker |
| S3 | Refund-redirection attack treated generically | Security | 🔴 Blocker |
| S5 | IP PIN unsupported → returns reject | Compliance/Sec | 🔴 Blocker |
| SC1 | Off-season "scale to zero" false for data | Scalability | 🔴 Blocker |
| U1 | "Simple" MVP narrower than IRS-acceptable simple | Assumptions | 🔴 Blocker |
| A3 | No carryforward modeling | Architecture | 🟠 Major |
| A4 | No engine/PDF/MeF reconciliation | Architecture | 🟠 Major |
| A5 | Fact-mapping layer hand-waved | Architecture | 🟠 Major |
| S4 | No e-signature/PIN/prior-year-AGI model | Security | 🟠 Major |
| C3 | MeF ack lifecycle oversimplified | Compliance | 🟠 Major |
| C4 | 8879/8867 retention (if preparer) | Compliance | 🟠 Major |
| C5 | Part-year/nonresident/multi-state coupling | Compliance | 🟠 Major |
| SC2 | Per-keystroke full recompute at scale | Scalability | 🟠 Major |
| SC3 | IRS throughput limits / Oct peak missing | Scalability | 🟠 Major |
| U2 | Partner removes less than claimed | Assumptions | 🟠 Major |
| U3 | Engine/forms/annual-update cost light | Assumptions | 🟠 Major |
| A6 | No data-import architecture | Architecture | 🟡 Moderate |
| S6 | Crypto-shred/key-residency unspecified | Security | 🟡 Moderate |
| C6 | §7216 format / MeF cutover / RT product | Compliance | 🟡 Moderate |
| SC4 | Year-partitioning doesn't shard hot data | Scalability | 🟡 Moderate |
| U4 | Test-corpus effort underestimated | Assumptions | 🟡 Moderate |
| U5 | Premium moat asserted; economics inverted | Assumptions | 🟡 Moderate |

**10 Blockers, 10 Major, 6 Moderate.**

---

## 8. Recommended Disposition

The strategy survives this review. **The engineering plan does not, as written.** Before any implementation is authorized:

1. **Decide C1 (DIY vs. preparer).** Nothing in compliance is scopeable until this is settled. Recommended answer: **DIY self-prep software.**
2. **Rebuild the engine model** around a **form-line dependency graph with iterative convergence and incremental recompute** (A1, A2, A4, SC2). This is the long pole and the doc has it wrong.
3. **Re-scope the MVP** against **what the IRS will actually accept** — including 8962, IP PIN, e-signature, EITC/CTC/education credits (U1, C2, S4, S5) — and re-estimate cost/timeline accordingly.
4. **Fix the security invariants** to reflect that SSNs and bank data *must* flow to filing/PDF, and model **every person on the return** plus the **refund-redirection** attack (S1, S2, S3).
5. **Add the missing subsystems**: carryforward ledger, data import, amended-return lifecycle, and the **"we filed wrong returns" operational runbook** (A3, A6, §6 checklist).

Until items 1–5 are addressed, the document is an **investment thesis, not a buildable architecture.** Fund the thesis; do not yet build from the blueprint.

---

*Reviewed adversarially and in good faith. The harshness is the point: every blocker above is cheaper to fix in a document than in a filing season. Tax-treatment, e-file, and compliance assertions here are engineering judgment and must be confirmed with qualified tax counsel and an IRS e-file specialist before relying on them.*
