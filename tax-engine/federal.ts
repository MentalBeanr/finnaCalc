/**
 * Typed convenience over the federal TY2024 ruleset.
 *
 * Maps a friendly, cents-based input to the engine's node-keyed input, runs the
 * fixed-point solver, and reads the form-line results back out. This is the
 * boundary the application's federal-support layer will call.
 */
import { evaluate } from "./core/solver"
import type { TraceEntry } from "./core/types"
import { FEDERAL_TY2024 } from "./rulesets/federal/ty2024"
import { STATUS } from "./rulesets/federal/ty2024/params"

export type FilingStatus = keyof typeof STATUS

export interface FederalReturnInput {
    filingStatus: FilingStatus
    wagesCents: number
    interestCents?: number
    socialSecurityCents?: number
    iraContributionCents?: number
    withholdingCents?: number
    numChildren?: number

    // Schedule C / self-employment (1099-NEC)
    schedCNetProfitCents?: number

    // Schedule D — capital gains/losses
    shortTermGainCents?: number
    longTermGainCents?: number

    // Dividends (1099-DIV)
    ordinaryDividendsCents?: number
    qualifiedDividendsCents?: number

    // Itemized deductions (Schedule A)
    mortgageInterestCents?: number
    saltPaidCents?: number
    charitableContributionsCents?: number
    medicalExpensesCents?: number

    // Education — above-the-line deduction + AOTC credit
    studentLoanInterestCents?: number
    qualifiedEducationExpensesCents?: number
    numEligibleStudents?: number

    // Child and Dependent Care Credit (Form 2441)
    dependentCareExpensesCents?: number
    numDependentCarePersons?: number
}

export interface FederalReturnResult {
    converged: boolean
    iterations: number
    taxYear: number
    agiCents: number
    deductionCents: number
    usingItemizedDeduction: boolean
    taxableIncomeCents: number
    taxBeforeCreditsCents: number
    creditsCents: number
    taxAfterCreditsCents: number
    selfEmploymentTaxCents: number
    earnedIncomeCreditCents: number
    studentLoanInterestDeductionCents: number
    aotcCreditCents: number
    aotcRefundableCents: number
    cdccCreditCents: number
    withholdingCents: number
    taxableSocialSecurityCents: number
    /** Positive = refund, negative = amount owed. */
    refundOrDueCents: number
    marginalRateBp: number
    formLineValues: Record<string, number>
    trace: TraceEntry[]
}

export function computeFederalReturn(input: FederalReturnInput): FederalReturnResult {
    const result = evaluate(
        {
            taxYear: 2024,
            values: {
                "in.filingStatus": STATUS[input.filingStatus],
                "F1040.L1a": input.wagesCents,
                "F1040.L2b": input.interestCents ?? 0,
                "F1040.L6a": input.socialSecurityCents ?? 0,
                "in.iraContribution": input.iraContributionCents ?? 0,
                "in.numChildren": input.numChildren ?? 0,
                "in.withholding": input.withholdingCents ?? 0,
                "in.schedCNet": input.schedCNetProfitCents ?? 0,
                "in.shortTermGain": input.shortTermGainCents ?? 0,
                "in.longTermGain": input.longTermGainCents ?? 0,
                "in.ordinaryDivs": input.ordinaryDividendsCents ?? 0,
                "in.qualifiedDivs": input.qualifiedDividendsCents ?? 0,
                "in.mortgageInt": input.mortgageInterestCents ?? 0,
                "in.saltPaid": input.saltPaidCents ?? 0,
                "in.charitableContr": input.charitableContributionsCents ?? 0,
                "in.medicalExpenses": input.medicalExpensesCents ?? 0,
                "in.studentLoanInterest": input.studentLoanInterestCents ?? 0,
                "in.qualifiedEdExp": input.qualifiedEducationExpensesCents ?? 0,
                "in.numStudents": input.numEligibleStudents ?? 0,
                "in.dependentCareExpenses": input.dependentCareExpensesCents ?? 0,
                "in.numDependentCarePersons": input.numDependentCarePersons ?? 0,
            },
        },
        FEDERAL_TY2024,
    )

    const v = (id: string): number => result.values[id] ?? 0

    return {
        converged: result.converged,
        iterations: result.iterations,
        taxYear: FEDERAL_TY2024.taxYear,
        agiCents: v("F1040.L11"),
        deductionCents: v("F1040.L12"),
        usingItemizedDeduction: v("WS.usingItemized") === 1,
        taxableIncomeCents: v("F1040.L15"),
        taxBeforeCreditsCents: v("F1040.L16"),
        creditsCents: v("F1040.L19") + v("F1040.L28") + v("WS.cdccCredit"),
        taxAfterCreditsCents: v("F1040.L22"),
        selfEmploymentTaxCents: v("SchedSE.L10"),
        earnedIncomeCreditCents: v("F1040.L27a"),
        studentLoanInterestDeductionCents: v("Sch1.L21"),
        aotcCreditCents: v("WS.aotcCredit"),
        aotcRefundableCents: v("F1040.L29"),
        cdccCreditCents: v("WS.cdccCredit"),
        withholdingCents: v("F1040.L33"),
        taxableSocialSecurityCents: v("F1040.L6b"),
        refundOrDueCents: v("F1040.L34") - v("F1040.L37"),
        marginalRateBp: v("WS.marginalRateBp"),
        formLineValues: result.values,
        trace: result.trace,
    }
}
