# Tax Engine

The deterministic calculation core, implementing
[`docs/tax-engine-specification.md`](../docs/tax-engine-specification.md).

> **Pure library.** No UI, API, database, clock, or network dependency. It takes
> a typed input and a ruleset and returns form-line-addressable results. Money is
> always integer cents. The tax year is an explicit input, never read from a
> clock.

## Layout

```
tax-engine/
  core/
    money.ts        integer-cents arithmetic + rate application
    primitives.ts   bracketTax, marginalRateBp, floor/cap/chooseMax, phase-out
    types.ts        RuleNode, Ruleset, EngineInput/Result, Trace
    graph.ts        node index, cycle detection, declared-cycle validation
    solver.ts       fixed-point evaluator + non-convergence tripwire
  rulesets/federal/ty2024/
    params.ts       the declarative "numbers" layer (cited, year-versioned)
    nodes.ts        the form-line node graph (rule logic)
    index.ts        the immutable FEDERAL_TY2024 ruleset
  federal.ts        computeFederalReturn — typed convenience wrapper
  index.ts          public entry point
  __tests__/        primitives, solver (cycles), federal golden fixtures
```

## How it computes

A computation is a **directed dependency graph of form-line / worksheet nodes**,
evaluated to a **fixed point** — not a single forward pass. Computed nodes are
recomputed in a stable order until no value changes (exact integer-cents
stability), so genuine cycles converge correctly. If the iteration cap is hit,
the result is a **NonConvergence tripwire**: the engine never emits a number it
is unsure about.

```ts
import { computeFederalReturn } from "@/tax-engine"

const r = computeFederalReturn({
    filingStatus: "single",
    wagesCents: 8_000_000, // $80,000
    withholdingCents: 900_000,
})
// r.taxableIncomeCents === 6_540_000, r.taxBeforeCreditsCents === 944_100,
// r.refundOrDueCents === -44_100 (owes $441), r.marginalRateBp === 2200
```

## Scope (foundational)

The federal TY2024 ruleset covers: wages, taxable interest, Social Security
taxability, deductible IRA contribution, standard deduction, ordinary-income tax,
a simplified Child Tax Credit, withholding, and refund/amount-owed. It is **not**
yet wired into the application — that integration is the federal-support phase.

**Deferred:** itemized deductions, credit phase-outs, ACA/Form 8962, EITC,
education credits, additional taxes (SE, NIIT, AMT), incremental recompute, and
state rulesets. The engine architecture (graph + solver + primitives) already
supports cycles and additional rulesets; these are content + integration, not new
machinery.

## Testing

`pnpm test` runs, among others:
- **primitives** — bracket boundaries and the worked examples to the cent,
- **solver** — a genuine cycle converging to its fixed point, a divergent cycle
  tripping the non-convergence guard, and the declared-cycle-inventory check,
- **federal golden fixtures** — hand-verified TY2024 returns (single, MFJ with
  children, and a Social-Security-taxability case).
