/**
 * Federal TY2024 node graph (the imperative "rule logic" layer,
 * tax-engine-specification.md §2). Nodes are form-line addressable; formulas are
 * pure functions of their dependencies and the cited parameters.
 *
 * Scope (foundational): wages, taxable interest, Social Security taxability,
 * deductible IRA contribution, standard deduction, ordinary-income tax, the
 * (simplified) Child Tax Credit, withholding, and refund/amount-owed. Itemized
 * deductions, credit phase-outs, ACA/8962, and other forms are deferred to the
 * federal-support phase.
 */
import { applyBp, nonNegative } from "@/tax-engine/core/money"
import { bracketTax, marginalRateBp } from "@/tax-engine/core/primitives"
import type { Read, RuleNode } from "@/tax-engine/core/types"
import {
    BRACKETS,
    CTC_PER_CHILD_CENTS,
    IRA_CONTRIBUTION_CAP_CENTS,
    SS_THRESHOLDS_CENTS,
    STANDARD_DEDUCTION_CENTS,
    STATUS,
    type StatusCode,
} from "./params"

function statusOf(read: Read): StatusCode {
    const code = Math.round(read("in.filingStatus"))
    return (code >= 0 && code <= 4 ? code : STATUS.single) as StatusCode
}

/** Simplified Social Security taxability (IRC §86 tiers). */
function taxableSocialSecurity(
    provisional: number,
    ssBenefits: number,
    t: { base: number; additional: number },
): number {
    if (provisional <= t.base) return 0
    const halfSS = applyBp(ssBenefits, 5000)
    if (provisional <= t.additional) {
        return Math.min(applyBp(provisional - t.base, 5000), halfSS)
    }
    const lowerTier = Math.min(applyBp(t.additional - t.base, 5000), halfSS)
    return Math.min(applyBp(ssBenefits, 8500), applyBp(provisional - t.additional, 8500) + lowerTier)
}

const input = (id: string, dataType: RuleNode["dataType"], citation: string): RuleNode => ({
    id,
    kind: "input",
    dataType,
    dependsOn: [],
    citation,
})

const computed = (
    id: string,
    dataType: RuleNode["dataType"],
    dependsOn: string[],
    formula: (read: Read) => number,
    citation: string,
): RuleNode => ({ id, kind: "computed", dataType, dependsOn, formula, citation })

export const FEDERAL_TY2024_NODES: RuleNode[] = [
    // ── Inputs ────────────────────────────────────────────────────────────────
    input("in.filingStatus", "count", "Filing status (0=single,1=mfj,2=mfs,3=hoh,4=qss)"),
    input("F1040.L1a", "money", "Form 1040 line 1a — wages"),
    input("F1040.L2b", "money", "Form 1040 line 2b — taxable interest"),
    input("F1040.L6a", "money", "Form 1040 line 6a — Social Security benefits"),
    input("in.iraContribution", "money", "Deductible IRA contribution"),
    input("in.numChildren", "count", "Qualifying children under 17"),
    input("in.withholding", "money", "Federal income tax withheld"),

    // ── Worksheets & computed lines ────────────────────────────────────────────
    computed(
        "WS.provisionalIncome",
        "money",
        ["F1040.L1a", "F1040.L2b", "F1040.L6a"],
        (r) => r("F1040.L1a") + r("F1040.L2b") + applyBp(r("F1040.L6a"), 5000),
        "Social Security Benefits Worksheet — provisional income",
    ),
    computed(
        "F1040.L6b",
        "money",
        ["in.filingStatus", "WS.provisionalIncome", "F1040.L6a"],
        (r) =>
            taxableSocialSecurity(
                r("WS.provisionalIncome"),
                r("F1040.L6a"),
                SS_THRESHOLDS_CENTS[statusOf(r)],
            ),
        "Form 1040 line 6b — taxable Social Security",
    ),
    computed(
        "Sch1.L20",
        "money",
        ["in.iraContribution"],
        (r) => Math.min(r("in.iraContribution"), IRA_CONTRIBUTION_CAP_CENTS),
        "Schedule 1 line 20 — IRA deduction",
    ),
    computed(
        "F1040.L11",
        "money",
        ["F1040.L1a", "F1040.L2b", "F1040.L6b", "Sch1.L20"],
        (r) => r("F1040.L1a") + r("F1040.L2b") + r("F1040.L6b") - r("Sch1.L20"),
        "Form 1040 line 11 — adjusted gross income",
    ),
    computed(
        "F1040.L12",
        "money",
        ["in.filingStatus"],
        (r) => STANDARD_DEDUCTION_CENTS[statusOf(r)],
        "Form 1040 line 12 — standard deduction",
    ),
    computed(
        "F1040.L15",
        "money",
        ["F1040.L11", "F1040.L12"],
        (r) => nonNegative(r("F1040.L11") - r("F1040.L12")),
        "Form 1040 line 15 — taxable income",
    ),
    computed(
        "F1040.L16",
        "money",
        ["in.filingStatus", "F1040.L15"],
        (r) => bracketTax(r("F1040.L15"), BRACKETS[statusOf(r)]),
        "Form 1040 line 16 — tax",
    ),
    computed(
        "WS.marginalRateBp",
        "rate_bp",
        ["in.filingStatus", "F1040.L15"],
        (r) => marginalRateBp(r("F1040.L15"), BRACKETS[statusOf(r)]),
        "Marginal rate (basis points)",
    ),
    computed(
        "F1040.L19",
        "money",
        ["in.numChildren"],
        (r) => Math.max(0, Math.round(r("in.numChildren"))) * CTC_PER_CHILD_CENTS,
        "Form 1040 line 19 — Child Tax Credit (simplified)",
    ),
    computed(
        "F1040.L22",
        "money",
        ["F1040.L16", "F1040.L19"],
        (r) => nonNegative(r("F1040.L16") - r("F1040.L19")),
        "Form 1040 line 22 — tax after credits",
    ),
    computed(
        "F1040.L33",
        "money",
        ["in.withholding"],
        (r) => r("in.withholding"),
        "Form 1040 line 33 — total payments",
    ),
    computed(
        "F1040.L34",
        "money",
        ["F1040.L33", "F1040.L22"],
        (r) => nonNegative(r("F1040.L33") - r("F1040.L22")),
        "Form 1040 line 34 — overpayment (refund)",
    ),
    computed(
        "F1040.L37",
        "money",
        ["F1040.L22", "F1040.L33"],
        (r) => nonNegative(r("F1040.L22") - r("F1040.L33")),
        "Form 1040 line 37 — amount you owe",
    ),
]
