/**
 * Client-safe interview constants, parsing, and the model → engine mapping.
 *
 * No Node/DB imports. The tax-engine import is type-only, so this module stays
 * out of any runtime bundle concern. I/O lives in lib/server/return-inputs.ts;
 * the estimate is computed server-side with computeFederalReturn.
 */
import type { FederalReturnInput, FilingStatus } from "@/tax-engine"

/** Income types the foundational interview collects (a subset of the schema). */
export const INCOME_TYPE_OPTIONS = [
    { value: "w2", label: "W-2 wages" },
    { value: "1099_int", label: "Interest income (1099-INT)" },
    { value: "ss", label: "Social Security benefits" },
] as const

export type InterviewIncomeType = (typeof INCOME_TYPE_OPTIONS)[number]["value"]

export function isInterviewIncomeType(value: string): value is InterviewIncomeType {
    return INCOME_TYPE_OPTIONS.some((o) => o.value === value)
}

export function incomeTypeLabel(value: string): string {
    return INCOME_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value
}

/** Parse a user-entered dollar string to integer cents, or null if invalid. */
export function parseDollarsToCents(input: string): number | null {
    const cleaned = input.trim().replace(/[$,\s]/g, "")
    if (cleaned === "" || !/^-?\d*\.?\d+$/.test(cleaned)) return null
    const dollars = Number(cleaned)
    if (!Number.isFinite(dollars) || dollars < 0) return null
    return Math.round(dollars * 100)
}

export interface IncomeLine {
    type: string
    amountCents: number
    withholdingCents: number
}

/**
 * Map the return's collected inputs to a federal engine input. Returns null when
 * filing status is not yet set (the estimate cannot be computed). Income types
 * the foundational engine does not yet model are ignored.
 */
export function mapToFederalInput(args: {
    filingStatus: string | null
    income: IncomeLine[]
    numChildren: number
}): FederalReturnInput | null {
    if (!args.filingStatus) return null

    let wages = 0
    let interest = 0
    let socialSecurity = 0
    let withholding = 0
    for (const line of args.income) {
        withholding += line.withholdingCents
        if (line.type === "w2") wages += line.amountCents
        else if (line.type === "1099_int") interest += line.amountCents
        else if (line.type === "ss") socialSecurity += line.amountCents
    }

    return {
        filingStatus: args.filingStatus as FilingStatus,
        wagesCents: wages,
        interestCents: interest,
        socialSecurityCents: socialSecurity,
        withholdingCents: withholding,
        numChildren: args.numChildren,
    }
}
