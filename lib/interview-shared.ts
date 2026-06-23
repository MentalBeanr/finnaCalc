/**
 * Client-safe interview constants, parsing, and the model → engine mapping.
 *
 * No Node/DB imports. The tax-engine import is type-only, so this module stays
 * out of any runtime bundle concern. I/O lives in lib/server/return-inputs.ts;
 * the estimate is computed server-side with computeFederalReturn.
 */
import type { FederalReturnInput, FilingStatus } from "@/tax-engine"

/** Income types the interview collects. */
export const INCOME_TYPE_OPTIONS = [
    { value: "w2", label: "W-2 wages" },
    { value: "1099_nec", label: "Self-employment / freelance (1099-NEC)" },
    { value: "1099_int", label: "Interest income (1099-INT)" },
    { value: "1099_div", label: "Dividends (1099-DIV)" },
    { value: "1099_b", label: "Capital gain or loss (1099-B)" },
    { value: "ss", label: "Social Security benefits" },
] as const

export type InterviewIncomeType = (typeof INCOME_TYPE_OPTIONS)[number]["value"]

export function isInterviewIncomeType(value: string): value is InterviewIncomeType {
    return INCOME_TYPE_OPTIONS.some((o) => o.value === value)
}

export function incomeTypeLabel(value: string): string {
    return INCOME_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value
}

/** Itemized deduction types the interview collects. */
export const DEDUCTION_TYPE_OPTIONS = [
    { value: "mortgage_interest", label: "Mortgage interest (1098)" },
    { value: "salt", label: "State & local taxes paid" },
    { value: "charitable", label: "Charitable contributions" },
    { value: "medical", label: "Medical expenses" },
    { value: "student_loan", label: "Student loan interest (1098-E)" },
    { value: "aotc_expenses", label: "Education expenses per student (AOTC / Form 8863)" },
    { value: "cdcc_expenses", label: "Dependent care expenses per person (Form 2441 / CDCC)" },
] as const

export type InterviewDeductionType = (typeof DEDUCTION_TYPE_OPTIONS)[number]["value"]

export function isInterviewDeductionType(value: string): value is InterviewDeductionType {
    return DEDUCTION_TYPE_OPTIONS.some((o) => o.value === value)
}

export function deductionTypeLabel(value: string): string {
    return DEDUCTION_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value
}

/** Parse a user-entered dollar string to integer cents, or null if invalid. */
export function parseDollarsToCents(input: string): number | null {
    const cleaned = input.trim().replace(/[$,\s]/g, "")
    if (cleaned === "" || !/^-?\d*\.?\d+$/.test(cleaned)) return null
    const dollars = Number(cleaned)
    if (!Number.isFinite(dollars) || dollars < 0) return null
    return Math.round(dollars * 100)
}

/**
 * Like parseDollarsToCents but allows negative values.
 * Used for capital gains/losses where a net loss is a negative number.
 */
export function parseSignedDollarsToCents(input: string): number | null {
    const cleaned = input.trim().replace(/[$,\s]/g, "")
    if (cleaned === "" || !/^-?\d*\.?\d+$/.test(cleaned)) return null
    const dollars = Number(cleaned)
    if (!Number.isFinite(dollars)) return null
    return Math.round(dollars * 100)
}

export interface IncomeLine {
    type: string
    amountCents: number
    withholdingCents: number
    metadata: Record<string, unknown>
}

export interface DeductionLine {
    type: string
    amountCents: number
}

/**
 * Map the return's collected inputs to a federal engine input. Returns null when
 * filing status is not yet set (the estimate cannot be computed).
 */
export function mapToFederalInput(args: {
    filingStatus: string | null
    income: IncomeLine[]
    numChildren: number
    deductions: DeductionLine[]
}): FederalReturnInput | null {
    if (!args.filingStatus) return null

    let wages = 0
    let interest = 0
    let socialSecurity = 0
    let withholding = 0
    let schedCNet = 0
    let shortTermGain = 0
    let longTermGain = 0
    let ordinaryDivs = 0
    let qualifiedDivs = 0

    for (const line of args.income) {
        withholding += line.withholdingCents

        switch (line.type) {
            case "w2":
                wages += line.amountCents
                break
            case "1099_nec":
            case "sch_c":
                schedCNet += line.amountCents
                break
            case "1099_int":
                interest += line.amountCents
                break
            case "1099_div": {
                ordinaryDivs += line.amountCents
                const qc = line.metadata?.qualifiedCents
                if (typeof qc === "number") qualifiedDivs += qc
                break
            }
            case "1099_b": {
                const term = line.metadata?.term
                if (term === "short") {
                    shortTermGain += line.amountCents
                } else {
                    // Default long-term if term not specified.
                    longTermGain += line.amountCents
                }
                break
            }
            case "ss":
                socialSecurity += line.amountCents
                break
        }
    }

    let mortgageInterest = 0
    let saltPaid = 0
    let charitable = 0
    let medical = 0
    let studentLoanInterest = 0
    // Each aotc_expenses entry represents one eligible student.
    let aotcExpenses = 0
    let numStudents = 0
    // Each cdcc_expenses entry represents one qualifying care person (child <13 or disabled dependent).
    let cdccExpenses = 0
    let numDependentCarePersons = 0

    for (const ded of args.deductions) {
        switch (ded.type) {
            case "mortgage_interest":
                mortgageInterest += ded.amountCents
                break
            case "salt":
            case "property_tax":
                saltPaid += ded.amountCents
                break
            case "charitable":
                charitable += ded.amountCents
                break
            case "medical":
                medical += ded.amountCents
                break
            case "student_loan":
                studentLoanInterest += ded.amountCents
                break
            case "aotc_expenses":
                aotcExpenses += ded.amountCents
                numStudents += 1
                break
            case "cdcc_expenses":
                cdccExpenses += ded.amountCents
                numDependentCarePersons += 1
                break
        }
    }

    return {
        filingStatus: args.filingStatus as FilingStatus,
        wagesCents: wages,
        interestCents: interest,
        socialSecurityCents: socialSecurity,
        withholdingCents: withholding,
        numChildren: args.numChildren,
        schedCNetProfitCents: schedCNet,
        shortTermGainCents: shortTermGain,
        longTermGainCents: longTermGain,
        ordinaryDividendsCents: ordinaryDivs,
        qualifiedDividendsCents: qualifiedDivs,
        mortgageInterestCents: mortgageInterest,
        saltPaidCents: saltPaid,
        charitableContributionsCents: charitable,
        medicalExpensesCents: medical,
        studentLoanInterestCents: studentLoanInterest,
        qualifiedEducationExpensesCents: aotcExpenses,
        numEligibleStudents: numStudents,
        dependentCareExpensesCents: cdccExpenses,
        numDependentCarePersons,
    }
}
