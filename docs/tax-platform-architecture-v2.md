# FinnaCalc Tax Platform — Architecture v2 (Blocker-Resolution Revision)

**Supersedes (in the contested areas):** `docs/tax-platform-architecture.md` (v1)
**Resolves:** `docs/tax-platform-architecture-review.md` — all 10 Blockers and 10 Major findings
**Document type:** Revised buildable architecture (engineering blueprint, not a thesis)
**Status:** DRAFT FOR REVIEW — supersedes v1 §4, §6, §7, §8, §9, §12, §16 where they conflict; v1 stands for unchanged sections (personas, UX, revenue rationale).

> **What this document is.** The v1 proposal was a sound investment thesis with an unbuildable engine model, a contradictory PII invariant, an undecided legal identity, and a "simple" MVP that the IRS would reject. The adversarial review catalogued this as 10 Blockers + 10 Major. This revision **resolves every one of them** with concrete design — not by softening the claims, but by changing the architecture. Where v1 and v2 disagree, **v2 wins.**

> **Reviewer's framing, accepted.** "Fund the thesis; do not yet build from the blueprint." This document is the corrected blueprint. After it, the thesis is also buildable.

---

## 0. Resolution Traceability Matrix

Every finding from the review, mapped to where it is resolved here. This matrix is the contract of this document.

| Finding | Sev | Resolved in | One-line resolution |
|---|---|---|---|
| **C1** DIY vs. preparer undecided | 🔴 | §2 | FinnaCalc is **DIY self-prep software**, stated and re-derived. |
| **U1** "Simple" MVP narrower than IRS-acceptable | 🔴 | §3 | MVP re-scoped to the real acceptable-return surface (EITC/CTC/education/8962/PIN/e-sign). |
| **C2** Form 8962/ACA missing → rejects | 🔴 | §3.2, §4.6 | 8962 in MVP scope; hard detect-and-decline gate for out-of-scope facts. |
| **A1** Linear pipeline can't model circular calcs | 🔴 | §4.2–4.4 | Engine is a **form-line dependency graph with iterative fixed-point evaluation**. |
| **A2** Stage model ≠ form-line source of truth | 🔴 | §4.1, §4.5 | Computation modeled as **forms/lines/worksheets** as first-class, citation-linked nodes. |
| **S1** "SSN never leaves vault" is false | 🔴 | §6.2 | Replaced with a **minimized, audited decryption path** to filing/PDF. |
| **S2** Spouse/dependent/minor SSNs unmodeled | 🔴 | §5.2, §6.3 | **Every person on the return** is a vault-protected identity; minors flagged. |
| **S3** Refund-redirection attack generic | 🔴 | §6.4 | Dedicated **bank-change control plane** (step-up, cooling-off, velocity, ownership check). |
| **S5** IP PIN unsupported → rejects | 🔴 | §3.2, §5.2 | IP PIN is a first-class per-year vault field with reject handling. |
| **SC1** "Scale to zero" false for data | 🔴 | §8.1 | Cost model **split**: elastic compute (scales down) vs. always-on encrypted data. |
| **A3** No carryforward modeling | 🟠 | §4.6, §5.3 | **Carryforward ledger** as explicit engine input/output and data entity. |
| **A4** No engine/PDF/MeF reconciliation | 🟠 | §4.5, §7.3 | **Form-line values are the single source**; PDF + MeF derive from them; reconciliation test gate. |
| **A5** Fact-mapping layer hand-waved | 🟠 | §4.7 | **Fact Mediation Layer** is a named subsystem with its own ownership and tests. |
| **S4** No e-signature/PIN/prior-AGI model | 🟠 | §6.5 | Self-Select PIN + prior-year-AGI / IP-PIN signature flow specified. |
| **C3** MeF ack lifecycle oversimplified | 🟠 | §7.2 | Full **submission state machine** (per-jurisdiction transmit→validate→ack). |
| **C4** 8879/8867 retention | 🟠 | §2.2 | **Dissolved by the DIY decision** — neither applies; documented why. |
| **C5** Part-year/nonresident/multi-state coupling | 🟠 | §7.4 | **Resident-only first**; inter-state credit coupling acknowledged and deferred. |
| **SC2** Per-keystroke full recompute too costly | 🟠 | §4.4 | **Incremental, memoized evaluation** via dirty-tracking on the calc graph. |
| **SC3** IRS throughput/Oct peak missing | 🟠 | §8.2 | IRS modeled as a **rate-limited external dependency**; two peaks + cutover. |
| **U2** Partner removes less than claimed | 🟠 | §7.1 | Explicit **partner does / does-not absorb** table. |
| Moderate ×6 (A6,S6,C6,SC4,U4,U5) | 🟡 | §9 | Addressed/scheduled in the consolidated moderate-findings section. |

---

## 1. What Changed and Why (executive delta)

Five architectural changes carry the entire resolution:

1. **The engine is no longer a pipeline.** It is a **directed dependency graph of form-lines and worksheets**, evaluated to a **fixed point** by an iterative solver, with **incremental recompute**. This single change resolves A1, A2, A4, and SC2 — the four findings that made v1 unbuildable.
2. **FinnaCalc is DIY self-prep software**, full stop. This resolves C1 and *dissolves* C4 (preparer-only obligations vanish), and re-bases the entire compliance posture.
3. **The MVP is scoped to what the IRS will actually accept**, not to "W-2 + standard deduction." This resolves U1 and forces C2/S5 (8962, IP PIN) into scope.
4. **The PII model tells the truth:** SSNs and bank data *must* reach the filing path, so we minimize, gate, and audit that path instead of pretending it doesn't exist. Resolves S1, and extends to every person on the return (S2) and the refund-redirection attack (S3).
5. **The cost/scale model separates elastic compute from always-on data**, and treats the **IRS itself as a capacity constraint.** Resolves SC1 and SC3.

Everything else is detail in service of these five.

---

## 2. Legal Identity Decision — DIY Self-Prep Software (resolves C1, C4)

### 2.1 The decision
**FinnaCalc is do-it-yourself self-preparation software.** The *taxpayer* prepares and signs their own return; FinnaCalc provides the software and (via a partner) transmits. FinnaCalc is **not** a paid preparer and **not** an ERO-as-preparer. This is the only model consistent with the v1 personas (self-serve) and the named competitors (TurboTax, FreeTaxUSA, Cash App Taxes — all DIY).

### 2.2 What this decision changes (re-derived compliance posture)

| Obligation | Applies to DIY software? | Consequence |
|---|---|---|
| **Form 8867 (EITC/CTC/AOTC due diligence)** | **No** — it is a *paid-preparer* obligation | C4 dissolved; no §6695(g) per-failure penalty exposure. |
| **PTIN per preparer** | **No** — no preparer signs | No PTIN program needed. |
| **Form 8879 (ERO signature authorization) retention** | **No** in the ERO-preparer sense | The taxpayer self-signs via **Self-Select PIN** (§6.5), not 8879. |
| **IRS e-file provider authorization (software developer + transmitter roles)** | **Yes** | Still need EFIN + software certification (or a partner — §7.1). |
| **IRS Pub 1345 software/advertising rules** | **Yes** | Applies to the software. |
| **§7216 use/disclosure of taxpayer data** | **Yes — fully** | Unchanged from v1; remains a hard constraint. |
| **FTC Safeguards Rule / GLBA WISP** | **Yes — fully** | Unchanged from v1; applies from the moment documents are stored. |
| **IRS Security Six / Pub 4557 / Pub 5708** | **Yes** | Unchanged. |

**Net effect:** the DIY decision *removes* the preparer-only burdens (8867, PTIN, 8879-as-ERO) and *retains* the software-provider and data-protection burdens. This is materially lighter than the ambiguous v1 posture — and, critically, it is now **scopeable**.

### 2.3 The one place DIY adds obligation
DIY self-prep does **not** exempt FinnaCalc from **return accuracy expectations** or from the **e-file software certification (ATS)**. The IRS certifies the *software*, regardless of who signs. So accuracy rigor (§4) and ATS (§7) are undiminished.

---

## 3. Re-Scoped MVP — "IRS-Acceptable Simple" (resolves U1, C2, S5)

### 3.1 The principle
v1's MVP was scoped to a *calculator's* idea of simple. v2 scopes to the **smallest return the IRS will accept and not reject** for a mainstream filer. The gate is: *"Can a typical W-2 household actually file this without hitting a reject or an unsupported form?"*

### 3.2 MVP federal scope (the real minimum)
Forms/credits that MUST be in the MVP engine because omitting them either rejects the return or excludes a large mainstream population:

| Item | Why it's mandatory for a real "simple" MVP |
|---|---|
| Form 1040 + Schedules 1–3 (as needed) | The return itself. |
| Standard deduction (all statuses) | Baseline. |
| **W-2 wages, withholding** | The persona. |
| **EITC** (Sch EIC) | Huge mainstream population; its own qualifying-child logic. |
| **Child Tax Credit / ACTC** (Sch 8812) | Mainstream; refundable portion + phase-outs. |
| **Education credits** (Form 8863, AOTC/LLC) | Mainstream; common with dependents. |
| **Form 8962 / 1095-A (ACA reconciliation)** | **Return rejects without it** if APTC was received (resolves C2). |
| **IP PIN** entry | **Return rejects** if a required IP PIN is omitted/wrong (resolves S5). |
| **Self-Select PIN + prior-year-AGI** e-signature | Required to e-file at all (resolves S4 at MVP). |
| Interest/dividends (Sch B threshold logic) | Common, simple. |
| **Saver's Credit (8880), Child/Dependent Care (2441)** | Common enough to avoid mass detect-and-decline. |

### 3.3 The detect-and-decline gate (the safety valve)
Anything outside MVP scope must be **detected and explicitly declined**, never silently mis-computed. The interview classifies the return's facts; if any fact maps to an unsupported form (Schedule C, D, E, K-1, multi-state, part-year, AMT, etc.), the user is told **before filing**: *"FinnaCalc can't file this return yet because it includes X. Here's why, and here's what to do."* This converts "narrow scope" from a silent accuracy risk into an honest product boundary — and is itself a trust feature.

### 3.4 Re-estimated consequence
This scope is **most of an individual return engine**, not a calculator. The roadmap (§8.4) and cost are revised accordingly: the "engine + MVP" line in v1 §16 is **understated**; v2 treats the federal individual engine as the primary multi-quarter investment, with the detect-and-decline gate as the mechanism that lets it ship before it's complete.

---

## 4. Tax Engine v2 — Form-Line Dependency Graph (resolves A1, A2, A3, A4, A5, SC2)

This is the heart of the revision. v1's pipeline is replaced wholesale.

### 4.1 Model: forms, lines, and worksheets as first-class nodes (resolves A2)
The unit of computation is **not** an abstract "stage." It is a **node** representing a specific **form line or worksheet line**, addressable by its legal identity (e.g., `F1040.L11` = Form 1040, line 11, AGI), carrying:
- its **value** (integer cents),
- its **formula** (a pure function of other nodes' values),
- its **dependencies** (the nodes it reads),
- its **IRS citation** (publication/form/line reference) for audit-grade explainability,
- its **ruleset year** binding.

Because nodes are form-line-addressable, every golden fixture from an IRS example maps **directly** ("1040 line 16 should equal $9,221"), and the explainability trace is a **legally meaningful** statement, not a debug log. This is what v1 promised in §6 and could not deliver with stages.

### 4.2 Model: a directed dependency graph, not a line (resolves A1, part 1)
Nodes form a **directed graph** by their dependencies. Most edges flow "forward" (income → AGI → tax), but the graph **permits cycles** because real tax has them:

```
   F1040.L6b (taxable SS) ──reads──▶ F1040.L11 (AGI)
        ▲                                  │
        └──────────reads (SS worksheet)────┘     ← genuine cycle
```

Other modeled cycles: IRA-deduction ↔ MAGI; ½-SE-tax ↔ AGI ↔ AGI-phase-outs (student loan, education, PTC); QBI ↔ taxable-income limit; Saver's-Credit ↔ AGI. The graph **declares** these cycles rather than pretending the computation is acyclic.

### 4.3 Evaluation: iterative fixed-point solver (resolves A1, part 2)
The engine does **not** do a single forward pass. It runs a **fixed-point iteration**:

```
function evaluate(graph, inputs):
    seed all input nodes; set all computed nodes = UNRESOLVED
    repeat:
        snapshot = current values
        for each node in dependency-topological order (cycles broken arbitrarily):
            node.value = node.formula(dependencies' current values)
        if max |Δ| across all nodes == 0 (exact integer-cents stability):
            return values + trace            # converged
        if iteration > MAX_ITER:
            raise NonConvergence(node-deltas) # tripwire → alert, never file
```

- **Convergence is exact** because money is integer cents — the loop terminates when no node changes, not at an epsilon. Tax worksheets are designed to converge (the IRS worksheets are themselves iterative); divergence means a **bug**, and `NonConvergence` is a hard tripwire that blocks filing and pages on-call.
- **Cycle correctness** is validated against IRS worksheet examples that specifically exercise the SS/IRA/PTC interactions (the fixtures U4 demanded).

### 4.4 Performance: incremental, memoized recompute (resolves SC2)
The "live estimate on every keystroke" is preserved **without** full recompute:
- Each node memoizes its last value + the hash of its inputs.
- A user edit **dirties** only the changed input node and **transitively marks** its dependents dirty (a graph walk), leaving the rest memoized.
- The solver re-evaluates **only the dirty subgraph** to a fixed point. A typical W-2 edit touches a handful of nodes, not the whole 1040.
- This makes per-keystroke recompute cheap at 1M users — resolving the cost concern SC2 raised against v1's "pure recompute scales horizontally" hand-wave. Purity is retained (formulas are pure); **full** recompute is not required.

### 4.5 Reconciliation: form-line values are the single source (resolves A4)
There is exactly **one** computed representation — the graph's form-line values. Both downstream artifacts **derive** from it:
- the **PDF renderer** reads `F1040.L16` and prints it on line 16;
- the **MeF serializer** reads `F1040.L16` and emits the corresponding MeF XML element.

Neither recomputes anything. A **reconciliation test** runs on every golden fixture and every release: `engine_values → PDF_extracted_values → MeF_XML_values` must be **identical to the cent**. Divergence fails CI. This guarantees the "the PDF says X but you filed Y" class of bug cannot ship.

### 4.6 Carryforwards and multi-year state (resolves A3, C2 mechanics)
A return is **not** year-independent. The engine takes a **prior-year carryforward bundle** as input and emits a **next-year carryforward bundle** as output:
- **Inputs:** capital-loss carryover, NOL, AMT-credit carryforward, passive-activity-loss carryover, charitable carryover, §179, prior-year AGI (for e-sign), prior-year APTC facts.
- **Outputs:** the same, recomputed for next year.
- Carryforwards are **persisted in a ledger** (§5.3) keyed by user + tax_year, so an **amended prior year** can re-emit corrected carryforwards that **cascade forward** (a first-class, tested operation, not an afterthought).

Form 8962's APTC reconciliation is modeled as ordinary graph nodes reading the carryforward/1095-A inputs — no special-casing.

### 4.7 The Fact Mediation Layer — a named subsystem (resolves A5)
Between the interview and the engine sits the layer the review correctly identified as the largest real subsystem. It is now **named, owned, and tested** as a first-class component:

```
  Interview answers            Fact Mediation Layer              Engine inputs
  ("I had a baby in 2024") ──▶ (life-event → tax-fact mapping) ──▶ (dependent[n].qualifying_child = true,
   "I got a 1095-A"            + completeness/edge checks          F8962 inputs populated, …)
                              + detect-and-decline classifier
                                        │
                                        └──▶ drives §3.3 scope gate
```

- It owns the **lossy, high-bug-density mapping** from human life-events to tax facts.
- It owns the **detect-and-decline classifier** (§3.3) — it is the component that knows whether a return is in scope.
- It has **its own test suite** independent of the engine (you test the mapping and the calculation separately), and its own team ownership. The review's point — "this is bigger than the engine" — is accepted and reflected in the org/test structure.

### 4.8 Folder structure (revised from v1 §6.2)

```
/tax-engine
  /core
    graph.ts            // Node, Edge, dependency graph, cycle declaration
    solver.ts           // fixed-point evaluator + dirty-tracking incremental recompute
    money.ts            // integer-cents arithmetic + IRS rounding
    trace.ts            // citation-linked explainability output
    nonconvergence.ts   // tripwire
  /forms
    /ty2024
      f1040.ts          // nodes for each line, formulas, citations
      sch1.ts sch2.ts sch3.ts sch8812.ts schEIC.ts
      f8962.ts f8863.ts f2441.ts f8880.ts
      /worksheets
        taxable-ss.ts   // the canonical cyclic worksheet
        qbi-limit.ts
    /ty2025 ...
  /carryforward
    bundle.ts           // typed prior-year-in / next-year-out
  /reconciliation
    pdf-extract.ts mef-extract.ts diff.ts   // A4 test gate
  /tests
    /golden  /property  /cycles  /reconciliation
```

### 4.9 Worked example, revised (the cyclic case v1 couldn't do)
> Single filer, TY2024, \$30,000 wages + \$20,000 Social Security benefits, \$7,000 deductible-IRA contribution intent.

A forward pass (v1) computes the IRA deduction and taxable SS **once** and gets both wrong, because taxable SS depends on AGI which depends on the IRA deduction which (via MAGI) depends on taxable SS. v2's solver iterates: seed → compute provisional taxable SS → compute AGI → recompute IRA-deduction allowability → recompute MAGI → recompute taxable SS → … until no node changes. The converged values match the IRS "Social Security Benefits Worksheet" + "IRA Deduction Worksheet" examples exactly, and that pair becomes a **cycle fixture** in `/tests/cycles`.

---

## 5. Data Model v2 — People, Carryforwards, Filings (resolves S2, A3; supports C3)

### 5.1 Change summary vs. v1 §7
v1 modeled "the user's SSN." v2 models **every person on the return**, a **carryforward ledger**, and a **per-jurisdiction filing state machine**.

### 5.2 People on the return (resolves S2, S5)
```
return_people
  id · return_id · role (taxpayer|spouse|dependent)
  · person_vault_token (FK → pii_vault, NOT the SSN)
  · is_minor (bool)                ← heightened handling
  · relationship · qualifying_child · qualifying_relative
  · ip_pin_vault_token?            ← per-year IP PIN, vault-protected (S5)
```
- **Each** taxpayer/spouse/dependent SSN is a separate vault identity; `is_minor` drives stricter access/retention/breach treatment.
- IP PIN is a per-person, per-year vault secret with its own reject-handling path.

### 5.3 Carryforward ledger (resolves A3)
```
carryforwards
  id · user_id · tax_year · type (cap_loss|nol|amt_credit|pal|charitable|sec179|prior_agi|aptc_fact)
  · amount_cents · source_return_id · superseded_by_return_id?
```
- Append-only; an amended return **supersedes** prior carryforwards and triggers forward cascade (§4.6).

### 5.4 Bank instructions (resolves S3 data side)
```
bank_instructions
  id · return_id · purpose (refund_deposit|balance_due_debit)
  · account_vault_token (routing+account encrypted in vault)
  · ownership_verified (bool) · last_changed_at · change_step_up_at
```
Bank data lives in the **vault**, not the core DB, and carries the change-control metadata that §6.4 enforces.

### 5.5 Filings (revised, resolves C3)
```
filings
  id · return_id · jurisdiction (federal|state:XX)
  · channel (partner|direct_mef)
  · state (built→transmitted→received→validated→accepted|rejected|imperfect)
  · linkage (linked_fed_state|unlinked)
  · ack_code · reject_codes_json · submission_id
  · transmitted_at · acknowledged_at
```
**Per-jurisdiction** rows with a **full state machine** — federal and each state ack independently (C3).

---

## 6. Security v2 — Truthful PII Flow (resolves S1, S2, S3, S4, S5)

### 6.1 The corrected premise
v1 asserted "raw SSNs never leave the vault." **That is false:** the MeF payload, the printed 1040, and direct-deposit bank numbers **require cleartext** at filing time. v2 stops pretending and instead **minimizes, gates, and audits** the unavoidable decryption path.

### 6.2 The minimized decryption path (resolves S1)
```
Only TWO components may request vault decryption of SSN/bank data:
  (1) MeF Serializer  — at transmission time, for the outgoing payload
  (2) PDF Renderer    — at user-initiated view/download of the official return

Rules enforced at the vault boundary:
  • Each decryption requires a scoped, short-lived authorization grant tied to a
    specific return_id and purpose (file | render).
  • Plaintext is held only in-process, never persisted, never logged, zeroized after use.
  • EVERY decryption emits an audit event (who/what/why/return) BEFORE plaintext is returned.
  • No other service (interview, analytics, notifications, support tooling) can decrypt — ever.
```
The invariant is now **true and enforceable**: SSNs leave the vault *only* through two audited components, *only* at filing/render, *never* into logs/analytics/notifications.

### 6.3 Every person is a protected identity (resolves S2)
The decryption path and audit apply per-person (taxpayer/spouse/**dependent/minor**). Minor SSNs (`is_minor`) get the strictest retention and are explicitly enumerated in the breach-notification playbook (minors' identity theft has distinct legal notification implications).

### 6.4 Refund-redirection control plane (resolves S3)
Bank-account changes are the defining tax-fraud control point, so they get a **dedicated control plane**, separate from ordinary profile edits:
- **Step-up authentication** (WebAuthn re-assert) required to add/change `bank_instructions`.
- **Cooling-off + out-of-band notification** to the account's verified email/phone on any bank change ("did you do this?").
- **Velocity & reuse checks**: same account/routing across many returns, or a bank change immediately before filing, routes to the **fraud review queue** and can **hold transmission**.
- **Account-ownership verification** before a refund is routed to a newly-added account.
- All bank changes are immutable audit events.

### 6.5 Taxpayer e-signature (resolves S4, S5)
DIY returns are signed by the taxpayer via **Self-Select PIN**, authenticated by **prior-year AGI** (pulled from the carryforward ledger §5.3) **or** prior-year Self-Select PIN, plus **IP PIN** where the taxpayer has one. The signature flow:
- collects/validates prior-year AGI (a known phishing target → rate-limited, never echoed),
- applies the IP PIN to the return (omission/mismatch → specific reject-remediation path),
- records consent + signature as an audited, immutable event.

### 6.6 Unchanged-from-v1 controls (still in force)
MFA (WebAuthn-preferred), RBAC + tenant isolation, KMS/HSM key separation, mandatory log redaction (tested as security code), tamper-evident audit log, JIT/four-eyes admin access, IR plan with breach-notification mapping. v1 §8 stands for these.

---

## 7. Filing & MeF v2 (resolves C3, C5, U2)

### 7.1 What the partner transmitter does and does NOT absorb (resolves U2)
| Concern | Partner absorbs? |
|---|---|
| MeF transport / connectivity / ack plumbing | **Yes** |
| MeF schema version tracking (transport-level) | Partly |
| **IRS certification/ATS of FinnaCalc's software** | **No** — the IRS certifies *our* software |
| **§7216 / Safeguards / WISP** | **No** — fully ours |
| **Fraud prevention duties** | **No** — ours |
| **EFIN (if we act as our own ERO/transmitter later)** | **No** — ours when we insource |
| Reject-code remediation UX & content | **No** — ours |

The partner removes the **transport**, not the **certification or the regulatory posture**. Planning reflects this honestly.

### 7.2 Submission state machine (resolves C3)
```
built ─▶ transmitted ─▶ received ─▶ validated ─▶ {accepted | rejected | imperfect}
                                                      │
                                          rejected ─▶ remediate ─▶ rebuilt ─▶ retransmitted
                                          (48h retransmission window honored)
```
- **Per-jurisdiction**: federal and each state run this machine **independently**; `linked_fed_state` vs `unlinked` modeled explicitly.
- **Imperfect Return** acceptance is a distinct terminal state, surfaced to the user.
- The **reject-code corpus is thousands of business rules**; remediation content is a **standing ongoing effort**, resourced as such, not a feature.

### 7.3 Reconciliation gate at the boundary (reinforces A4)
The MeF serializer is one of only two vault-decrypting components (§6.2) **and** is bound to the form-line single source (§4.5). The pre-transmit check re-runs the engine↔MeF reconciliation diff on the actual outgoing payload; mismatch **blocks transmission**.

### 7.4 State strategy: resident-first; inter-state coupling acknowledged (resolves C5)
- **Resident-only returns first**, highest-population states by ROI.
- **Part-year and nonresident returns are explicitly deferred** (detect-and-decline until supported), because **credit-for-taxes-paid-to-other-states couples states together** — State A's return depends on State B's tax — which breaks any "each state is an independent integration" assumption. When built, multi-state is modeled as **another set of graph nodes with cross-jurisdiction edges**, reusing the §4 engine, not a parallel system.

---

## 8. Scalability & Cost v2 (resolves SC1, SC3, SC4)

### 8.1 Split cost model — compute scales down, data does not (resolves SC1)
| Tier | Seasonal behavior | Cost shape |
|---|---|---|
| **Stateless compute** (API, engine svc, workers) | Autoscale up Jan–Apr & Oct, down otherwise | **Elastic — approaches baseline off-season** |
| **Encrypted data** (returns, carryforwards, documents, vault, audit) | **Always on, all year** | **Fixed floor** — amendments, Oct extensions, IRS notices years later, users pulling returns for loans |
v1's "scale to near-zero off-season" was true only for compute. v2 budgets the **always-on data floor** as a standing cost and uses tiered storage (hot current year → cold prior years under WORM retention), **not** shutdown.

### 8.2 The IRS is a capacity constraint (resolves SC3)
- **MeF has IRS-side throughput limits and a scheduled annual shutdown/cutover** (≈ late Nov–Jan) during which **no one can file**. The filing pipeline models the IRS/partner as a **rate-limited external dependency** with queue + backpressure ("queued for transmission" is an acceptable user state; data loss is not).
- **Two peaks** are planned: **April 15** and **October 15** (extensions), plus a **year-round long tail** (amendments, notices). Capacity tests run for both.

### 8.3 Hot-data sharding (resolves SC4)
Partition-by-`tax_year` alone leaves the **current-year partition hot** during season. v2 **shards the current-year working set by user** (consistent hashing) so peak load spreads horizontally; cold prior years stay year-partitioned and archived.

### 8.4 Roadmap delta (revising v1 §14)
- **Phase 2 (engine)** is re-scoped to the **graph engine + fixed-point solver + incremental recompute + Fact Mediation Layer + carryforward ledger** — larger than v1's "engine MVP," and the genuine long pole.
- **Phase 3 (filing)** adds the **detect-and-decline gate, 8962/IP-PIN/Self-Select-PIN, reconciliation gate, refund-redirection controls, and the full submission state machine** before any real transmission.
- Timeline: v1's "first real federal filing ~18–24 months" is **retained only as a floor**, explicitly gated on the wider MVP scope (§3) and the season calendar; treat 24 months as the planning number.

---

## 9. Remaining Moderate Findings (A6, S6, C6, SC4, U4, U5)

| Finding | Disposition in v2 |
|---|---|
| **A6** Data import (brokerage/payroll/prior-year) | Promoted to a **core subsystem on the roadmap** with its own security review; required before claiming the investor/freelancer segments. Not in MVP (those segments are detect-and-declined until then). |
| **S6** Crypto-shred / key & backup residency | **Crypto-shredding** is the deletion mechanism reconciling right-to-delete vs. retention; keys in US-region KMS/HSM; backups pinned to US regions, in-scope for vault controls. |
| **C6** §7216 consent format / MeF cutover / Refund Transfer | §7216 consents use the **mandated separate-signed-consent format**; MeF cutover modeled in §8.2; **Refund Transfer is consciously deferred** (it is a bank-partner-regulated product — revisited only post-revenue, not in MVP). |
| **SC4** Hot-data sharding | Resolved in §8.3. |
| **U4** Test corpus is a multi-year asset | Accepted: golden + **cycle** + property + **cross-software** fixtures are a **standing program**, seeded from IRS examples + existing FinnaCalc calculators, expanded continuously. |
| **U5** Premium moat asserted; economics inverted | Accepted as a **bet, stated as a bet**: cheap-to-serve W-2 users won't pay; the paying investor/SMB segments are the most expensive to build (and are gated behind §4 + import). The wedge is **year-round engagement from the existing calculator audience**, the one channel cheaper than out-spending Intuit. No architectural claim that this is de-risked — only that the platform is built to exploit it if it holds. |

---

## 10. Disposition

With this revision:
- **All 10 Blockers are resolved** (graph engine + fixed point + form-line model + reconciliation; DIY decision; real MVP scope incl. 8962/IP-PIN; truthful PII path; every-person identities; refund-redirection controls; split cost model).
- **All 10 Major findings are resolved** (carryforwards, reconciliation gate, Fact Mediation Layer, e-signature, MeF state machine, dissolved 8879/8867, resident-first state coupling, incremental recompute, IRS-as-constraint, partner-scope honesty).
- **All 6 Moderate findings are dispositioned** (§9).

The review's conclusion was: *"an investment thesis, not a buildable architecture."* This document makes it buildable. The engine model is now correct for how tax actually computes, the legal identity is decided, the MVP is what the IRS will accept, the security model is true, and the cost/scale plan accounts for the data floor and the IRS itself.

**Recommended next step:** a **proof-of-concept of the graph engine + fixed-point solver** against the canonical cyclic worksheets (taxable SS + IRA + PTC), with the engine→PDF→MeF reconciliation harness, as the Phase-0 spike that retires the highest technical risk before full funding of Phase 2.

---

*This revision is engineering judgment, not legal/tax advice. The DIY-software compliance posture (§2), e-file certification path (§7), and §7216/Safeguards obligations must be confirmed with qualified tax counsel and an IRS e-file specialist before any handling of real taxpayer data or filings. No implementation is authorized by this document.*
