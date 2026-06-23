/**
 * Client-safe federal-support helpers: node-id splitting, review diagnostics, and
 * the review breakdown builder. No Node/DB imports (the engine import is
 * type-only).
 */
import type { FederalReturnResult } from "@/tax-engine"

/** Split a node id ("F1040.L11") into its form and line ids for storage. */
export function splitNodeId(nodeId: string): { formId: string; lineId: string } {
    const i = nodeId.indexOf(".")
    if (i < 0) return { formId: nodeId, lineId: "_" }
    return { formId: nodeId.slice(0, i), lineId: nodeId.slice(i + 1) }
}

export type Severity = "error" | "warning"

export interface ReviewDiagnostic {
    severity: Severity
    code: string
    message: string
}

/**
 * Foundational completeness checks that gate the move to "ready to file". A real
 * deployment mirrors the IRS MeF business rules here (tax-engine-specification.md
 * §4.5); this is the starting subset.
 */
export function federalReviewDiagnostics(args: {
    filingStatus: string | null
    incomeCount: number
}): ReviewDiagnostic[] {
    const diagnostics: ReviewDiagnostic[] = []
    if (!args.filingStatus) {
        diagnostics.push({
            severity: "error",
            code: "FILING_STATUS_REQUIRED",
            message: "Select a filing status before filing.",
        })
    }
    if (args.incomeCount === 0) {
        diagnostics.push({
            severity: "error",
            code: "INCOME_REQUIRED",
            message: "Add at least one income source.",
        })
    }
    return diagnostics
}

export interface BreakdownRow {
    label: string
    valueCents: number
    /** Render as a subtraction (deduction, credit). */
    negative?: boolean
    /** Emphasize (the bottom-line tax). */
    emphasis?: boolean
}

/** The ordered, explainable review breakdown derived from a federal result. */
export function buildFederalBreakdown(result: FederalReturnResult): BreakdownRow[] {
    const flv = result.formLineValues
    const totalIncome =
        (flv["F1040.L1a"] ?? 0) + (flv["F1040.L2b"] ?? 0) + (flv["F1040.L6b"] ?? 0)
    return [
        { label: "Total income", valueCents: totalIncome },
        { label: "Adjusted gross income", valueCents: result.agiCents },
        { label: "Standard deduction", valueCents: result.deductionCents, negative: true },
        { label: "Taxable income", valueCents: result.taxableIncomeCents },
        { label: "Tax", valueCents: result.taxBeforeCreditsCents },
        { label: "Child Tax Credit", valueCents: result.creditsCents, negative: true },
        { label: "Total tax", valueCents: result.taxAfterCreditsCents, emphasis: true },
        { label: "Federal tax withheld", valueCents: result.withholdingCents },
    ]
}
