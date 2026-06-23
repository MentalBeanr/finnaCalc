# FinnaCalc Tax Platform — Tax Engine Specification

**Companion to:** `docs/tax-platform-architecture-v2.md` (§4) and `docs/database-design.md` (§6)
**Document type:** Engine architecture specification (design, no implementation)
**Status:** DRAFT FOR REVIEW — architecture only; schematic notation is illustrative, not code
**Scope:** The deterministic calculation core — rule engine, calculation pipeline, validation, tax-year versioning, state extensions, testing.

> **What this document specifies.** The v2 architecture established *that* the engine is a form-line dependency graph evaluated to a fixed point. This document specifies *how* that engine is structured: the anatomy of a rule, how rules and parameters compose into a year-versioned ruleset, how the evaluator converges, how three layers of validation gate a calculation, how state rulesets compose onto the federal graph, and how the whole thing is tested to the standard a regulated, accuracy-critical product demands.
>
> **Non-negotiable inheritances from v2.** The engine is a **pure library** with no UI, API, network, clock, or database dependency (v2 §4.1, isolation). Money is **integer cents**. Tax year is an **explicit input**, never read from a clock. Computation is **form-line-addressable** so it reconciles with the printed return and the MeF payload (v2 §4.5). These are constraints, not choices, and every section below honors them.
>
> **Notation discipline.** Per the brief, this is architecture, not code. Data shapes are given in language-neutral `field: type — meaning` form; the evaluator is given as labeled *schematic* pseudocode where that materially clarifies the model. None of it is implementation.

---

## Table of Contents

1. [Engine Boundaries & Contract](#1-engine-boundaries--contract)
2. [Rule Engine](#2-rule-engine)
3. [Calculation Pipeline](#3-calculation-pipeline)
4. [Validation System](#4-validation-system)
5. [Tax-Year Versioning](#5-tax-year-versioning)
6. [State Tax Extensions](#6-state-tax-extensions)
7. [Testing Strategy](#7-testing-strategy)
8. [Explainability & Trace](#8-explainability--trace)
9. [Error Handling & Tripwire Taxonomy](#9-error-handling--tripwire-taxonomy)
10. [Module Structure](#10-module-structure)
11. [Open Questions](#11-open-questions)

---

## 1. Engine Boundaries & Contract

### 1.1 What the engine is and is not

| The engine **is** | The engine **is not** |
|---|---|
| A pure function: `(EngineInput, Ruleset) → EngineResult` | A service, a server, or a database client |
| Deterministic: same inputs → identical outputs, forever | Aware of "now" — tax year is an explicit input |
| Form-line-addressable in its outputs | Aware of users, sessions, auth, or UI |
| Independently versioned and independently testable | The owner of return *state* (that's the Returns Service) |
| The single source of computed truth (v2 §4.5) | The mapper of life-events → facts (that's the Fact Mediation Layer) |

### 1.2 The contract (inputs and outputs)

**`EngineInput`** — a complete, pre-validated description of one return for one jurisdiction-year:

```
EngineInput:
  tax_year:            integer            -- explicit; never from a clock
  jurisdiction:        'federal' | 'state:XX'
  filing_status:       enum               -- single | mfj | mfs | hoh | qss
  people:              Person[]           -- taxpayer, spouse, dependents (facts only; no raw SSN)
  facts:               FactSet            -- income, deductions, credits, elections (from Fact Mediation Layer)
  carryforward_in:     CarryforwardBundle -- prior-year ledger inputs (v2 §4.6)
  federal_linkage?:    FederalResult      -- present only for state jurisdictions (see §6)
  prior_year_agi?:     money              -- for e-sign verification; passthrough, not computed here
```

**`EngineResult`** — the complete computed output:

```
EngineResult:
  converged:           boolean            -- fixed-point reached
  iterations:          integer
  form_line_values:    FormLineValue[]    -- THE source of truth; PK (form_id, line_id)
  summary:             ResultSummary      -- denormalized headline figures (AGI, tax, refund/due, marginal rate)
  carryforward_out:    CarryforwardBundle -- next-year ledger outputs
  trace:               Trace              -- citation-linked explainability (§8)
  diagnostics:         Diagnostic[]       -- validation findings (§4)
  nonconvergence?:     NonConvergence     -- present iff converged = false (§9)
```

> **The engine never persists.** `EngineResult` is handed back to the Tax Engine Service (v2 §4.3), which writes `tax_calculations`, `form_line_values`, `calculation_trace`, and `carryforwards` per `database-design.md`. The engine itself touches nothing.

### 1.3 The three things outside the engine it depends on (by contract, not by call)
1. **Fact Mediation Layer** (v2 §4.7) produces the `FactSet` — the engine consumes facts, never life-events.
2. **Carryforward ledger** (database §6.4) supplies `carryforward_in` and stores `carryforward_out`.
3. **Reconciliation harness** (v2 §7.3) consumes `form_line_values` to drive the PDF renderer and MeF serializer — the engine guarantees those values are the single source.

---

## 2. Rule Engine

### 2.1 The unit of computation: a rule node

The engine's atom is a **node**, and every node corresponds to a **legally addressable location** — a form line or a worksheet line. This is the correction the review (A2) demanded: the model *is* the form, so a fixture that says "1040 line 16 = \$9,221" maps to exactly one node.

**Node anatomy** (declarative):

```
RuleNode:
  id:            NodeId            -- e.g. 'F1040.L11'  (form/worksheet . line)
  jurisdiction:  'federal' | 'state:XX'
  kind:          NodeKind          -- see §2.2
  data_type:     DataType          -- money_cents | count | rate_bp | boolean | enum | date
  formula:       Formula           -- pure; reads dependencies + parameters (see §2.4)
  depends_on:    NodeId[]          -- DECLARED dependencies (defines graph edges)
  reads_params:  ParamRef[]        -- which parameter tables it consults (§2.5)
  citation:      Citation          -- IRS form/line/pub reference (§8)
  nullable:      boolean           -- may this line be "not applicable"?
```

A node's `formula` is a **pure function of (its dependencies' current values, the parameter tables of its ruleset)**. It reads nothing else — no globals, no clock, no IO. Determinism is enforced *by the shape of a node*, not by convention.

### 2.2 Node kinds

| Kind | Purpose | Example |
|---|---|---|
| `input` | A value supplied by the `FactSet` (no formula) | W-2 wages |
| `aggregate` | Sum/collect across other nodes or fact collections | Total income = Σ income sources |
| `computed` | A formula over other nodes | AGI = total income − adjustments |
| `table_lookup` | Resolve a value from a parameter table by key | Standard deduction by filing status |
| `bracketed` | Apply a progressive bracket table | Tax before credits |
| `phaseout` | Interpolate a value across a phase-out range | CTC reduced by MAGI over threshold |
| `floor` / `cap` | Apply a statutory floor or ceiling | Medical > 7.5% AGI; SALT ≤ \$10k |
| `choice` | Select among alternatives by a rule | max(standard, itemized) |
| `conditional` | Gate a value on a predicate | Credit allowed only if AGI < limit |
| `passthrough` | Carry a value across jurisdictions or years | Federal AGI → state starting point |

### 2.3 The data/code split (the core maintainability decision)

Two layers, deliberately separated so that **most annual updates are data edits, not code changes** (this is what makes the yearly tax-law refresh a 2-week task instead of a 2-month one):

**Layer 1 — Declarative parameters (the *numbers*).** Brackets, standard deductions, phase-out start/end, credit amounts, contribution caps, floors. Pure data, keyed by `(jurisdiction, tax_year)`, every value carrying a **citation**. Changing a 2025 bracket is a reviewed, diffable data change — no logic touched.

**Layer 2 — Imperative rule logic (the *procedures*).** *How* a phase-out interpolates, the *ordering* of credits (non-refundable before refundable), how ½-SE-tax feeds AGI, how the standard-vs-itemized choice is made. This is the `formula` of computed nodes — unit-tested per rule, and **stable across years** (the 2024 and 2025 phase-out *mechanism* is usually identical; only the *parameters* move).

```
            ┌───────────────────────────┐         ┌──────────────────────────┐
            │  Layer 1: PARAMETERS       │         │  Layer 2: RULE LOGIC      │
            │  (data, per year, cited)   │ ──read──▶│  (formulas / node kinds)  │
            │  brackets, caps, phaseouts │         │  bracket-apply, interpolate│
            └───────────────────────────┘         │  ordering, choice, floor   │
                     ▲                              └──────────────────────────┘
            annual update = edit here                    rarely changes year-to-year
            (most of the work)
```

### 2.4 Rule primitives (combinators)

Rule logic is built from a **small set of audited primitives**, so the engine doesn't re-implement bracket math in fifty places. Each primitive is itself unit-tested to exhaustion (§7). Representative set:

| Primitive | Behavior |
|---|---|
| `applyBrackets(amount, bracketTable)` | Progressive tax over a bracket table; returns tax + marginal rate |
| `interpolatePhaseout(value, magi, start, end)` | Linear (or stepwise) reduction across a phase-out band |
| `applyFloor(amount, floorBasis, pct)` | Excess-over-floor (medical 7.5% AGI) |
| `applyCap(amount, ceiling)` | Statutory ceiling (SALT \$10k) |
| `chooseMax(a, b)` / `chooseGreaterOf(...)` | Standard-vs-itemized and similar elections |
| `tableLookup(table, key)` | Standard deduction, etc. |
| `thresholdStep(value, thresholds)` | Stepwise schedules |
| `nonNegative(amount)` | Floor at zero (taxable income, etc.) |

A node's `formula` is a composition of these primitives over its declared dependencies and parameters — nothing more exotic.

### 2.5 Parameter tables (Layer 1 in detail)

Parameter tables are the year-specific data, each row cited:

```
BracketTable:
  jurisdiction, tax_year, filing_status
  brackets: [{ floor_cents, rate_bp }, ...]   -- ordered; rate in basis points
  citation

PhaseoutParams:
  jurisdiction, tax_year, credit_id, filing_status
  threshold_start_cents, threshold_end_cents, reduction_basis
  citation

StandardDeductionTable / CreditParams / ContributionCaps / FloorParams ...
  (same pattern: keyed by jurisdiction+year, cited)
```

> **Citations are not decoration.** Every parameter and every node carries an IRS form/line/publication reference. This is what turns the explainability trace (§8) into an *audit-grade* artifact and what lets a tax analyst verify a parameter change against the source document during the annual update.

### 2.6 A ruleset

A **Ruleset** is the complete, immutable bundle for one `(jurisdiction, tax_year, ruleset_version)`:

```
Ruleset:
  jurisdiction, tax_year, ruleset_version
  nodes:       RuleNode[]          -- the graph (with declared edges)
  parameters:  ParameterTables     -- Layer 1
  supported:   ScopeManifest       -- which forms/facts this ruleset can compute (drives detect-and-decline)
  manifest:    { effective_dates, citations, version_lineage }
```

Graph construction is mechanical: collect nodes, resolve `depends_on` into directed edges (cycles allowed — §3.4), bind `reads_params` to the parameter tables. The result is the dependency graph the pipeline evaluates.

---

## 3. Calculation Pipeline

The word "pipeline" here means the **process around the engine**, not a linear calculation. The *calculation itself* is a fixed-point evaluation over the graph (v2 §4.3) — explicitly **not** a single forward pass, because real tax has circular dependencies (taxable Social Security ↔ AGI ↔ IRA deduction ↔ MAGI).

### 3.1 Pipeline stages (the process)

```
 (1) Input Assembly        FactSet + CarryforwardBundle + (federal linkage if state) → EngineInput
        │
 (2) Structural Validation  types, ranges, required-by-status            (§4.1)  ── fail-fast ──▶ Diagnostics
        │
 (3) Ruleset Binding        select Ruleset by (jurisdiction, tax_year, version)
        │
 (4) Graph Assembly         nodes + edges + parameters → evaluable dependency graph
        │
 (5) Fixed-Point Evaluation iterate to integer-cents stability           (§3.3–3.4)
        │                      └─ or incremental recompute on the dirty subgraph (§3.5)
        │
 (6) Result Assembly        form_line_values + summary + trace
        │
 (7) Result Validation      post-eval invariants / tripwires             (§4.3)  ── tripwire ──▶ alert + block
        │
 (8) Carryforward Emission  compute carryforward_out for next year
        │
 (9) Handoff                EngineResult → service → DB; form_line_values → reconciliation harness
```

Stages 2, 7 are validation gates (§4). Stage 5 is the heart.

### 3.2 Determinism guarantees (restated as invariants the pipeline enforces)
- **No clock:** `tax_year` is input (stage 1); the engine has no access to "now."
- **No randomness, no IO, no network:** node formulas are pure.
- **Integer cents:** all money arithmetic is in cents; rounding is explicit and centralized (one rounding module), applied at defined points (per-form rounding rules), never via float drift.
- **Stable ordering:** within an iteration, nodes are evaluated in a deterministic order (topological where acyclic; a fixed tie-break within cycles — §3.4), so a converged result is bit-identical across runs and platforms.

### 3.3 Fixed-point evaluation (schematic)

```
EVALUATE(graph, inputs):
    seed input nodes from inputs; mark all computed nodes UNRESOLVED
    iteration ← 0
    repeat:
        iteration ← iteration + 1
        snapshot ← current values of all nodes
        for node in deterministic_order(graph):          -- topo order; cycles tie-broken stably
            node.value ← node.formula(deps' current values, parameters)
        if values == snapshot (no node changed, exact integer-cents):
            return CONVERGED(values, iteration)
        if iteration > MAX_ITER:
            return NONCONVERGENCE(node deltas)            -- tripwire (§9); never produces a filed number
```

- **Exact convergence.** Because money is integer cents, the loop terminates when **no node changes** — not at an epsilon. This is decidable and clean.
- **Why it converges.** IRS worksheets that induce cycles (the Social Security Benefits Worksheet, the IRA Deduction Worksheet, the QBI limitation) are *designed* to converge — they are bounded and monotone in the relevant variable. The solver mirrors the IRS's own iterative intent. **Divergence means a bug**, which is exactly why non-convergence is a hard tripwire, not a silent best-effort.

### 3.4 Cycle handling

- Cycles are **declared, not discovered** — a node that participates in a known circular worksheet (e.g., `F1040.L6b` taxable SS) declares its dependency on `F1040.L11` (AGI) even though AGI also depends on it. The graph builder accepts the cycle.
- Within a cycle, the first iteration uses seed/zero values; subsequent iterations propagate until stable. The **deterministic tie-break** (a fixed node ordering) guarantees the same convergence path every run.
- **Cycle inventory** is part of the ruleset's documentation: every cycle in the graph is enumerated, cited to the IRS worksheet that creates it, and covered by a dedicated **cycle fixture** (§7.3). No undeclared cycles are permitted — the graph builder rejects a cycle that isn't in the inventory (catches accidental circular dependencies introduced by a bad formula).

### 3.5 Incremental recompute (the performance model — resolves review SC2)

The "live estimate on every keystroke" must not trigger a full-graph re-evaluation for millions of users at peak. The engine supports **incremental, memoized** evaluation:

- Each node memoizes `(input_hash → value)`.
- A fact edit **dirties** the corresponding input node and **propagates dirtiness along reverse-dependency edges** (everything downstream of the change).
- The solver re-runs the **fixed-point loop over the dirty subgraph only**; clean nodes serve memoized values.
- A typical W-2 edit touches a handful of nodes; the full graph is evaluated only on first computation or a broad change.

```
   edit(F_W2.wages) ──dirty──▶ F1040.L1 ──▶ total_income ──▶ AGI ──▶ taxable_income ──▶ tax ──▶ refund
                                  (only this path re-evaluates; the rest is memoized)
```

This preserves purity (formulas are still pure) while making per-keystroke recompute cheap. The DB-side cache key is `tax_calculations.inputs_hash` (database §6.1) so memoization survives across sessions/devices.

### 3.6 Multi-jurisdiction evaluation

A state return's graph is **composed onto** the federal result: state nodes read federal nodes via `passthrough`/`federal_linkage` (§6). The pipeline evaluates federal to a fixed point first, then evaluates the state graph with federal values available as seeds. Where states are mutually coupled (credit for taxes paid to other states — review C5), the composition is itself a cycle across jurisdictions; this is **explicitly deferred** to the multi-state phase (§6.5) and detect-and-declined until supported.

---

## 4. Validation System

Three layers, each a distinct gate at a distinct point, plus the scope classifier. The layers have different jobs and different failure modes, and conflating them is a classic source of either over-strict UX or silent wrong answers.

### 4.1 Layer 1 — Structural validation (pre-evaluation)

**When:** stage 2, before any calculation.
**Checks:** types, numeric ranges, required-by-filing-status fields, mutually-required fields, enum membership, person-roster coherence (e.g., a spouse only on MFJ/MFS).
**Failure mode:** **fail-fast** with typed diagnostics; nothing is computed on malformed input.
**Example checks:** wages ≥ 0; filing status ∈ enum; if `mfj` then exactly one spouse person; dependent count consistent with credit claims.

### 4.2 Layer 2 — Tax-logic validation (cross-field legality)

**When:** interleaved with / after evaluation, on the *facts and intermediate values*.
**Checks:** cross-field legality the structure can't catch — e.g., a credit claimed that the filing status forbids, a dependent claimed as qualifying-child who fails the age/residency facts, statutory caps exceeded, incompatible elections.
**Failure mode:** **user-actionable diagnostics** (error/warning), not crashes — these are conversations with the user ("you can't claim X and Y together"), surfaced by the interview.
**Output:** `Diagnostic { severity, code, message, attached_node_or_fact, citation }`.

### 4.3 Layer 3 — Result validation (post-evaluation invariants / tripwires)

**When:** stage 7, after a converged result.
**Checks:** *impossible* results — a defense-in-depth tripwire that should *never* fire in production: negative tax where impossible, refund exceeding total payments, a credit exceeding its statutory max, **non-convergence**, or an aggregate that violates a known identity.
**Failure mode:** **alert + block** — a fired result-tripwire pages on-call and prevents the number from reaching a filing. This is the engine catching *itself*.
**Distinction from review's critique:** these catch *impossible* values. **Subtly-wrong-but-plausible** values are caught by aggregate correctness monitoring in production (statistical anomaly detection on refund distributions — v2/review), which lives in observability, not the engine. Both are needed; this layer is only the hard-invariant tripwire.

### 4.4 The scope classifier (detect-and-decline)

Distinct from the three validation layers: the **ScopeManifest** (§2.6) declares which forms/facts a ruleset supports. The Fact Mediation Layer (v2 §4.7) classifies a return's facts against the manifest; anything unsupported (Schedule C, D, K-1, AMT, part-year/multi-state, etc.) routes to **detect-and-decline** *before* filing — an honest product boundary, never a silent mis-computation. The engine's role is to **declare** its supported scope precisely; the mediation layer enforces the gate.

### 4.5 Reject-prevention validation (mirroring MeF business rules)

The IRS MeF system enforces **thousands of business rules**; a violation is a post-transmission reject. To turn rejects into pre-filing diagnostics, the engine carries a **validation ruleset derived from the MeF business rules** for supported forms (e.g., "if Form 8962 APTC present, line X required"). This runs as an extended Layer 2 pass before transmission so the user fixes issues *before* the IRS sees them. Like all rulesets, it is **year-versioned** (MeF rules change annually).

### 4.6 Diagnostic model (shared)

```
Diagnostic:
  severity:   error | warning | info
  code:       stable identifier (e.g. 'CTC_AGI_LIMIT', 'MEF_IND_031')
  message:    plain-language, user-facing
  target:     NodeId | FactPath           -- what it attaches to (drives UX placement)
  citation:   IRS reference
  source:     structural | tax_logic | result | scope | mef_rule
```

---

## 5. Tax-Year Versioning

The defining recurring obligation of a tax company: the law changes every year, sometimes mid-season, and prior years must remain computable forever.

### 5.1 The versioning identity
A ruleset is immutable and identified by **`(jurisdiction, tax_year, ruleset_version)`**. The **engine code** is versioned separately (`engine_version`, semver/git-sha). Both are recorded on every calculation (`tax_calculations.ruleset_id` + `engine_version`, database §6.1), so any historical result is exactly reproducible.

### 5.2 Prior years are immutable
A TY2024 return is **always** computed by a TY2024 ruleset — forever. New tax years are **additive** (`/rulesets/ty2025` alongside `/rulesets/ty2024`), never mutations of prior years. This is what makes "the IRS asks three years later" answerable and what makes amended-prior-year computation correct (database §16.5).

### 5.3 Multiple live years simultaneously
The engine routinely holds **several active rulesets**: the current filing year, the prior year (extensions through October, late filers), and older years (amendments). The pipeline binds the ruleset by the return's `tax_year` (stage 3); there is no "current year" global.

### 5.4 Mid-season hot-patching
Tax law can change retroactively mid-season, and bugs are found in live rulesets. The protocol:
- A correction produces a **new `ruleset_version`** for that `(jurisdiction, tax_year)` — never an in-place edit.
- Each calculation records the exact `ruleset_version` that produced it.
- **Recomputation policy:** *unfiled* returns are re-evaluated against the new version on next access (and the user is shown what changed); *filed* returns keep their filed snapshot immutable, and affected users are flagged for a possible **amendment** (the cascade workflow, database §16.6). The engine never silently re-files.

### 5.5 The data/code split makes the annual update tractable
Because most year-over-year change is **parameters, not logic** (§2.3), the bulk of the annual update is a reviewed, cited **data diff** (`brackets`, `phaseouts`, `caps` for the new year), validated by the differential tests in §7.7. New *logic* (a genuinely new credit, a changed mechanism) is the smaller, code-reviewed remainder. This is the difference between a 2-week and a 2-month yearly refresh.

### 5.6 Ruleset manifest & lineage
Each ruleset's manifest records **effective dates**, **source citations**, **supported scope**, and **version lineage** (which version superseded which, and why). The lineage is the audit trail for "why did this number change between version 3 and 4 of TY2024?" — answered by the differential test report (§7.7), not archaeology.

### 5.7 Engine-code evolution vs. ruleset evolution
- **Ruleset change** (new year, new parameters): additive, frequent, mostly data.
- **Engine-code change** (a new node kind, a solver improvement): must pass the **entire golden corpus across all live years** unchanged (or with explicitly re-blessed diffs). A solver change that alters a TY2022 result is a regression unless deliberately and reviewably blessed.

---

## 6. State Tax Extensions

States are not "federal plus a rate." They are additional rulesets composed onto the federal graph, coupled to it through conformity, and — for part-year/nonresident — coupled to *each other*. This section honors review C5.

### 6.1 States as composed rulesets
A state ruleset uses the **same machinery** as federal — same node anatomy, same primitives, same solver, same validation layers. It adds:
- `jurisdiction = 'state:XX'` nodes,
- **cross-jurisdiction edges** reading federal nodes (via `passthrough` / `federal_linkage`),
- state-specific parameters and forms.

No parallel engine; the federal engine *is* the state engine with a different ruleset and a federal linkage input.

### 6.2 Federal linkage & starting points
States compute from a **federal starting point**, but which one varies:

| Pattern | Starting node | Example |
|---|---|---|
| AGI-based | Federal AGI (`F1040.L11`) | Many states |
| Taxable-income-based | Federal taxable income | Some states |
| Line-item-based | Selected federal lines | States that selectively conform |

The engine models this with a **`federal_linkage` input** (the relevant federal nodes' values) and state `passthrough` nodes that read it. A state node reads "Federal AGI" the same way it reads any dependency — the graph simply spans jurisdictions.

### 6.3 Conformity (the subtle part)
States conform to the federal code **as of a date** (static conformity) or **on a rolling basis**, and conform **selectively** (adopting some federal provisions, decoupling from others). This is modeled as **state parameters and override nodes**:
- A conformity parameter pins the federal definition a state adopts (e.g., "IRC as of 2023-01-01").
- Decoupling is a state node that **recomputes** a quantity under state rules instead of reading the federal value (e.g., a state that disallows a federal deduction has its own node that adds it back).

Conformity is therefore **data + targeted override logic**, consistent with the §2.3 split.

### 6.4 State e-file mapping
Each state's `form_line_values` map to that **state's MeF schema** (linked or unlinked to the federal submission — database §8 `filings.linkage`). The engine produces state form-line values; the state MeF serializer consumes them, with the same reconciliation guarantee as federal (v2 §7.3).

### 6.5 The coupling problem & scope sequencing (review C5)
- **Resident-only returns first.** A full-year resident of one state is a clean composition: federal → state, one direction.
- **Part-year and nonresident returns are deferred** (detect-and-decline) because **credit for taxes paid to other states couples State A ↔ State B** — State A's liability depends on State B's tax, which depends on allocation, which can depend back on State A. This is a **multi-jurisdiction cycle**, handled by the same fixed-point solver when built, but only after the resident-only base is proven.
- **Rollout is ROI-ranked** by population (v2 §7.4); each state is a new ruleset, not new engine code.

### 6.6 Why this reuses everything
Because a state ruleset is *just another ruleset*, it inherits the solver, validation layers, versioning, trace, and testing machinery wholesale. The marginal cost of a state is **content (nodes + parameters + citations + fixtures)**, not platform — which is the only way multi-state is economically tractable (the review's U3 cost concern is mitigated by this reuse, though the content cost remains real and is a standing team).

---

## 7. Testing Strategy

Determinism is *provable*, and in a regulated accuracy-critical product it must be *proven*. The test corpus is not a phase — it is a **permanent, growing asset** (review U4), and it is the company's deepest moat after the engine itself.

### 7.1 Golden / snapshot fixtures (the backbone)
- **Form:** `input.json → expected_form_line_values.json`, per `(jurisdiction, tax_year)`.
- **Provenance discipline:** every fixture **cites its source** — an IRS example, a worksheet walkthrough, a published instruction, or a cross-verified prepared return. No uncited fixtures.
- **The bless workflow:** any engine/ruleset change that alters a golden output **fails CI**; a human reviews the diff and either fixes the regression or **re-blesses** the new expected output with a recorded justification. Numbers never change silently.
- **Seeding:** the existing FinnaCalc TY2024 calculators (brackets, standard deductions) seed the first federal corpus.

### 7.2 Per-rule and per-parameter unit tests
- Every **primitive** (§2.4) is exhaustively tested at boundaries: bracket edges (the exact cent where a rate changes), phase-out start/end, floor/cap thresholds, zero, negative, very large.
- Every **parameter table** is tested at its boundaries — the bracket boundary is computed to the cent and asserted, so an off-by-one in a threshold is caught immediately.

### 7.3 Cycle fixtures (the v2-specific must-have)
- Dedicated fixtures for **every declared cycle** (§3.4): the canonical **taxable Social Security ↔ IRA deduction ↔ MAGI** interaction, the **QBI limitation**, the **PTC ↔ AGI** loop.
- Each asserts the **converged** values match the IRS worksheet example *and* that convergence occurred within the iteration bound. A forward-pass engine fails these; that is the point.

### 7.4 Property-based tests (invariants the law guarantees)
Generate randomized valid inputs and assert invariants that must always hold:
- `taxable_income ≥ 0`; `tax ≥ 0`; `refund ≤ total_payments + refundable_credits`.
- **Monotonicity** where the law guarantees it (more income → not-less tax, holding else equal).
- **Standard-vs-itemized** always picks the larger.
- **Phase-out continuity/monotonicity** across the band (no discontinuous jumps except where the law is a cliff — and cliffs are asserted as cliffs).

### 7.5 Reconciliation tests (the A4 gate)
- For every golden fixture: `engine_values → PDF-extracted_values → MeF-XML_values` must be **identical to the cent**. Divergence fails CI. This guarantees the printed return and the filed XML can never disagree with the engine (or each other).

### 7.6 IRS ATS conformance (the certification gate)
- The **IRS Assurance Testing System** scenarios are encoded as a fixture suite; passing them is a **hard release gate each tax year** (a compliance prerequisite to e-file, v2 §9). The golden corpus is structured so ATS scenarios slot in as first-class fixtures.

### 7.7 Differential testing across versions
- Year-over-year and version-over-version: run both rulesets on a shared input corpus and produce a **change report** ("TY2024→TY2025: bracket shift raised this cohort's tax by …"). Every diff must be **explainable** by a known law change; an unexplained diff is a bug. This also validates mid-season hot-patches (§5.4) — the report *is* the lineage justification (§5.6).

### 7.8 Cross-software reconciliation
- A corpus of returns is computed by FinnaCalc and **cross-checked against independent commercial software / hand-prepared returns**. Disagreements are triaged (our bug, their bug, or genuine ambiguity). This catches errors the IRS examples (sparse) don't cover — the combinatorial interaction space where real bugs live (review U4).

### 7.9 Mutation testing
- Periodically mutate engine logic and confirm the test suite **catches** the mutation. This measures *test strength*, not just coverage — a high-coverage suite that survives mutations is a false comfort in a tax engine.

### 7.10 Determinism & platform tests
- The same input yields **bit-identical** output across runs, machines, and time (no float drift, no locale dependence in rounding/formatting, no clock leakage). Asserted in CI on multiple runtimes.

### 7.11 Performance / load tests
- **Incremental recompute latency** (§3.5) under realistic edit patterns, measured at projected **peak × safety factor** (v2 §8) before each season.
- Full-graph evaluation cost per return, to size the Tax Engine Service fleet for the April/October peaks.

### 7.12 Coverage accounting
- Coverage is measured against the **ScopeManifest** (§2.6): every supported form/line/credit has golden + boundary + (if cyclic) cycle fixtures. A form is not "supported" until its fixture coverage gate is met — which is also what lets detect-and-decline be honest.

### 7.13 Test taxonomy summary

| Test type | Catches | Gate |
|---|---|---|
| Golden/snapshot | Output regressions | CI (bless workflow) |
| Per-rule / per-parameter | Boundary/threshold errors | CI |
| Cycle fixtures | Non-convergence / circular-calc errors | CI |
| Property-based | Invariant violations | CI |
| Reconciliation | Engine/PDF/MeF divergence | CI (release) |
| ATS conformance | IRS certification failures | Per-year release gate |
| Differential | Unexplained year/version changes | CI + review |
| Cross-software | Interaction-space errors | Periodic |
| Mutation | Weak tests | Periodic |
| Determinism | Non-reproducibility | CI |
| Performance | Peak-season latency/cost | Pre-season |

---

## 8. Explainability & Trace

The trace is a **first-class output**, not a debug log (review A2 made this verifiable by the form-line model).

- **Shape:** an ordered set of trace entries, each `{ node_id, value, formula_summary, dependencies: [{node_id, value}], citation }`.
- **Two consumers:** (1) the **UX** renders plain-language explanations ("your standard deduction of \$14,600 beat your itemized \$9,000, so we used the standard — IRS Pub 501"); (2) **audit support** reproduces exactly how a filed number was derived, line by line, with citations.
- **Persisted** as `calculation_trace.trace` (database §6.3), immutable per calculation.
- Because every node and parameter is cited (§2.5), the trace is an **audit-grade derivation**, answerable to "show me how line 16 was computed and under what authority."

---

## 9. Error Handling & Tripwire Taxonomy

The engine distinguishes **user-fixable conditions** (diagnostics) from **engine-integrity failures** (tripwires). The two never blur.

| Class | Trigger | Engine behavior | Downstream |
|---|---|---|---|
| **Structural error** | Malformed input (§4.1) | Reject pre-eval with typed diagnostic | Interview fixes the field |
| **Tax-logic diagnostic** | Illegal/incompatible facts (§4.2) | Return diagnostic (error/warning) | Surfaced to user |
| **MeF-rule diagnostic** | Would reject at IRS (§4.5) | Return diagnostic pre-filing | User fixes before transmission |
| **Scope decline** | Unsupported facts (§4.4) | Declare unsupported | Detect-and-decline UX |
| **Non-convergence** | Fixed point not reached in MAX_ITER (§3.3) | `NonConvergence` result; **no number produced** | Page on-call; **block filing** |
| **Result-invariant tripwire** | Impossible computed result (§4.3) | Block result; emit alert | Page on-call; **block filing** |
| **Unknown ruleset** | No ruleset for (jurisdiction, year) | Hard error | Cannot compute; surfaced as unsupported |

**Principle:** the engine **never emits a filed number it is unsure about.** A non-convergence or a fired invariant produces *no* usable result and an alert — failing closed, because in tax a wrong number is a financial harm.

---

## 10. Module Structure

Refines v2 §4.8 with the validation, versioning, and state concerns of this spec. Pure library; no framework, DB, or network imports anywhere in this tree.

```
/tax-engine
  /core
    contract.ts?           -- EngineInput / EngineResult shapes (types only)
    graph                  -- node model, edge resolution, cycle inventory + validation
    solver                 -- fixed-point evaluator + incremental dirty-tracking recompute
    money                  -- integer-cents arithmetic + centralized rounding rules
    primitives             -- applyBrackets, interpolatePhaseout, applyFloor/Cap, chooseMax, ...
    trace                  -- citation-linked explainability assembly
    tripwire               -- non-convergence + result-invariant handling
  /rulesets
    /federal
      /ty2024  { nodes/, parameters/, worksheets/, scope-manifest, manifest }
      /ty2025  { ... }                       -- additive; never mutates ty2024
    /state
      /CA/ty2024 { nodes/, parameters/, conformity, federal-linkage, scope-manifest }
      /NY/ty2024 { ... }
  /validation
    structural             -- Layer 1
    tax-logic              -- Layer 2
    result-invariants      -- Layer 3
    mef-rules/             -- reject-prevention rulesets, year-versioned
    scope                  -- ScopeManifest evaluation (detect-and-decline support)
  /reconciliation
    form-line-extract · pdf-extract · mef-extract · diff   -- the A4 gate harness (test-side)
  /tests
    /golden  /boundary  /cycles  /property  /reconciliation
    /ats  /differential  /cross-software  /determinism  /performance
```

> **Boundaries restated:** `/rulesets` is mostly **data** (the annual update surface). `/core` is **stable logic** (rarely changes year to year). `/validation` is **mixed** (structural/result stable; mef-rules + tax-logic year-versioned). This separation is what keeps the yearly refresh cheap and the core trustworthy.

---

## 11. Open Questions

- **Rounding granularity.** The IRS permits whole-dollar rounding on many forms; the engine computes in cents and rounds at defined form boundaries. The exact per-form rounding points need a cited rounding-rules table (a parameter set), validated by boundary fixtures.
- **Worksheet identity vs. form identity.** Some computations live only on worksheets that are not transmitted (no MeF line). These nodes still need stable `NodeId`s and citations for the trace, but are excluded from the MeF reconciliation set — the ScopeManifest must mark transmitted vs. worksheet-only nodes.
- **Cross-state cycle bounds.** When multi-state (part-year/nonresident) is built, the inter-state credit cycle's convergence bound and tie-break ordering need their own cycle fixtures and a proof sketch that the composition converges.
- **Ruleset authoring workflow.** Whether tax analysts edit parameters through a reviewed data format directly, or through an authoring tool that emits the parameter tables, is a tooling decision affecting the annual-update velocity (the §5.5 cost lever). Recommended: a cited, diff-reviewable data format with schema validation in CI.
- **Performance ceiling of full eval.** The per-return full-graph evaluation cost at the widest supported scope (many forms, state) sets the engine-service fleet size; needs measurement once the federal MVP graph exists (the Phase-0 spike is the right place to take the first reading).

---

*This is engineering architecture, not legal/tax advice. Rounding rules, MeF business-rule mirroring, ATS conformance, and state conformity specifics must be confirmed with qualified tax counsel and an IRS e-file specialist before relying on them. No implementation is specified or authorized by this document; schematic notation is illustrative only.*
