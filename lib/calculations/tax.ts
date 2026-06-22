import { D, Decimal, ZERO } from "@/lib/money/decimal"
import type {
    BusinessTaxInput,
    BusinessTaxResult,
    FilingStatus,
    IndividualTaxInput,
    IndividualTaxResult,
} from "@/lib/types/tax"

/**
 * 2024 federal income tax brackets, indexed by filing status. Each bracket
 * specifies its upper bound (exclusive) and the marginal rate in percent.
 * The top bracket uses Number.POSITIVE_INFINITY.
 */
export interface Bracket {
    upTo: number
    ratePercent: number
}

export const BRACKETS_2024: Record<FilingStatus, ReadonlyArray<Bracket>> = {
    single: [
        { upTo: 11600, ratePercent: 10 },
        { upTo: 47150, ratePercent: 12 },
        { upTo: 100525, ratePercent: 22 },
        { upTo: 191950, ratePercent: 24 },
        { upTo: 243725, ratePercent: 32 },
        { upTo: 609350, ratePercent: 35 },
        { upTo: Number.POSITIVE_INFINITY, ratePercent: 37 },
    ],
    married: [
        { upTo: 23200, ratePercent: 10 },
        { upTo: 94300, ratePercent: 12 },
        { upTo: 201050, ratePercent: 22 },
        { upTo: 383900, ratePercent: 24 },
        { upTo: 487450, ratePercent: 32 },
        { upTo: 731200, ratePercent: 35 },
        { upTo: Number.POSITIVE_INFINITY, ratePercent: 37 },
    ],
    head: [
        { upTo: 16550, ratePercent: 10 },
        { upTo: 63100, ratePercent: 12 },
        { upTo: 100500, ratePercent: 22 },
        { upTo: 191950, ratePercent: 24 },
        { upTo: 243700, ratePercent: 32 },
        { upTo: 609350, ratePercent: 35 },
        { upTo: Number.POSITIVE_INFINITY, ratePercent: 37 },
    ],
} as const

export const STANDARD_DEDUCTION_2024: Record<FilingStatus, number> = {
    single: 14600,
    married: 29200,
    head: 21900,
} as const

export const SALT_CAP = 10000
export const MEDICAL_AGI_THRESHOLD = 0.075
export const STUDENT_LOAN_DEDUCTION_CAP = 2500
export const CHILD_TAX_CREDIT_PER_DEPENDENT = 2000
/** Simplified EITC: phase-in rate × income, capped, available below an income cutoff. */
export const EITC_PHASE_IN_RATE = 0.45
export const EITC_MAX_CREDIT = 7430
export const EITC_INCOME_CAP = 60000

export const SE_TAX_RATE = 0.153
export const SE_BASE_FACTOR = 0.9235
export const SE_DEDUCTIBLE_PORTION = 0.5

/**
 * Walk the bracket table, accumulating tax bracket-by-bracket. Returns the
 * total tax owed and the marginal rate (the highest bracket the income
 * actually touches). Income at or below 0 produces 0 tax.
 */
export function applyBrackets(
    taxableIncome: Decimal,
    brackets: ReadonlyArray<Bracket>,
): { tax: Decimal; marginalRatePercent: Decimal } {
    const ti = taxableIncome.toNumber()
    if (ti <= 0) return { tax: ZERO, marginalRatePercent: ZERO }

    let tax = 0
    let lastBoundary = 0
    let marginalRate = 0
    for (const bracket of brackets) {
        const upper = bracket.upTo
        const inThisBracket = Math.min(ti, upper) - lastBoundary
        if (inThisBracket > 0) {
            tax += (inThisBracket * bracket.ratePercent) / 100
            marginalRate = bracket.ratePercent
        }
        if (ti <= upper) break
        lastBoundary = upper
    }
    return { tax: D(tax), marginalRatePercent: D(marginalRate) }
}

/**
 * Federal individual income tax for 2024. Applies SALT cap, medical AGI
 * floor, student-loan-interest cap, and the larger of standard vs itemized
 * deductions. Credits are subtracted after bracketed tax; result clamped at 0.
 *
 * Tax savings is reported against a baseline of standard deduction only,
 * no credits — i.e., what taking your deductions and credits actually saved
 * you in dollars.
 */
export function calculateIndividualTax(input: IndividualTaxInput): IndividualTaxResult {
    const standardDeduction = D(STANDARD_DEDUCTION_2024[input.filingStatus])

    const cappedStudentLoan = Decimal.min(
        input.studentLoanInterest,
        D(STUDENT_LOAN_DEDUCTION_CAP),
    )
    const cappedSalt = Decimal.min(input.stateLocalTax, D(SALT_CAP))
    const medicalThreshold = input.grossIncome.times(MEDICAL_AGI_THRESHOLD)
    const deductibleMedical = Decimal.max(
        ZERO,
        input.medicalExpenses.minus(medicalThreshold),
    )

    const itemizedDeductions = input.mortgageInterest
        .plus(input.charitableDonations)
        .plus(cappedSalt)
        .plus(deductibleMedical)

    const usingStandardDeduction = itemizedDeductions.lte(standardDeduction)
    const totalDeductions = usingStandardDeduction
        ? standardDeduction
        : itemizedDeductions

    const adjustedGrossIncome = input.grossIncome.minus(cappedStudentLoan)
    const taxableIncome = Decimal.max(ZERO, adjustedGrossIncome.minus(totalDeductions))

    const { tax: federalTax, marginalRatePercent } = applyBrackets(
        taxableIncome,
        BRACKETS_2024[input.filingStatus],
    )

    let taxCredits = ZERO
    if (input.childTaxCredit) {
        taxCredits = taxCredits.plus(
            input.dependents.times(CHILD_TAX_CREDIT_PER_DEPENDENT),
        )
    }
    if (input.earnedIncomeCredit && input.grossIncome.lt(EITC_INCOME_CAP)) {
        const phaseIn = input.grossIncome.times(EITC_PHASE_IN_RATE)
        taxCredits = taxCredits.plus(Decimal.min(D(EITC_MAX_CREDIT), phaseIn))
    }

    const finalTax = Decimal.max(ZERO, federalTax.minus(taxCredits))
    const effectiveRatePercent = input.grossIncome.gt(0)
        ? finalTax.div(input.grossIncome).times(100)
        : ZERO

    // Baseline: standard deduction, no credits — what you'd owe with no planning.
    const baselineTaxable = Decimal.max(
        ZERO,
        input.grossIncome.minus(standardDeduction),
    )
    const baselineTax = applyBrackets(
        baselineTaxable,
        BRACKETS_2024[input.filingStatus],
    ).tax
    const taxSavings = Decimal.max(ZERO, baselineTax.minus(finalTax))

    return {
        kind: "individual",
        grossIncome: input.grossIncome,
        adjustedGrossIncome,
        standardDeduction,
        itemizedDeductions,
        totalDeductions,
        usingStandardDeduction,
        taxableIncome,
        federalTax,
        marginalRatePercent,
        taxCredits,
        finalTax,
        effectiveRatePercent,
        taxSavings,
    }
}

/**
 * Federal business tax for a sole proprietor / single-member LLC. Computes
 * self-employment tax on 92.35% of net business income, deducts half from
 * AGI, applies the single-filer standard deduction, then bracket tax.
 *
 * Tax savings is reported against the baseline of taking no business
 * deductions (full income flows through).
 */
export function calculateBusinessTax(input: BusinessTaxInput): BusinessTaxResult {
    const totalDeductions = input.businessExpenses
        .plus(input.homeOffice)
        .plus(input.vehicleExpenses)
        .plus(input.equipment)
    const netBusinessIncome = Decimal.max(
        ZERO,
        input.businessIncome.minus(totalDeductions),
    )

    const seTaxableIncome = netBusinessIncome.times(SE_BASE_FACTOR)
    const selfEmploymentTax = seTaxableIncome.times(SE_TAX_RATE)
    const deductibleSETax = selfEmploymentTax.times(SE_DEDUCTIBLE_PORTION)

    const adjustedGrossIncome = netBusinessIncome.minus(deductibleSETax)
    const standardDeduction = D(STANDARD_DEDUCTION_2024.single)
    const taxableIncome = Decimal.max(
        ZERO,
        adjustedGrossIncome.minus(standardDeduction),
    )

    const { tax: federalTax, marginalRatePercent } = applyBrackets(
        taxableIncome,
        BRACKETS_2024.single,
    )

    const totalTax = federalTax.plus(selfEmploymentTax)
    const effectiveRatePercent = input.businessIncome.gt(0)
        ? totalTax.div(input.businessIncome).times(100)
        : ZERO

    // Baseline: no business deductions; full income flows through.
    const baselineNet = input.businessIncome
    const baselineSE = baselineNet.times(SE_BASE_FACTOR).times(SE_TAX_RATE)
    const baselineDeductibleSE = baselineSE.times(SE_DEDUCTIBLE_PORTION)
    const baselineAgi = baselineNet.minus(baselineDeductibleSE)
    const baselineTaxable = Decimal.max(ZERO, baselineAgi.minus(standardDeduction))
    const baselineFederalTax = applyBrackets(baselineTaxable, BRACKETS_2024.single).tax
    const baselineTotal = baselineFederalTax.plus(baselineSE)
    const taxSavings = Decimal.max(ZERO, baselineTotal.minus(totalTax))

    return {
        kind: "business",
        businessIncome: input.businessIncome,
        totalDeductions,
        netBusinessIncome,
        selfEmploymentTax,
        deductibleSETax,
        adjustedGrossIncome,
        standardDeduction,
        taxableIncome,
        federalTax,
        marginalRatePercent,
        totalTax,
        effectiveRatePercent,
        taxSavings,
    }
}
