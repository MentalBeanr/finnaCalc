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
}

export interface FederalReturnResult {
    converged: boolean
    iterations: number
    taxYear: number
    agiCents: number
    deductionCents: number
    taxableIncomeCents: number
    taxBeforeCreditsCents: number
    creditsCents: number
    taxAfterCreditsCents: number
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
        taxableIncomeCents: v("F1040.L15"),
        taxBeforeCreditsCents: v("F1040.L16"),
        creditsCents: v("F1040.L19"),
        taxAfterCreditsCents: v("F1040.L22"),
        withholdingCents: v("F1040.L33"),
        taxableSocialSecurityCents: v("F1040.L6b"),
        refundOrDueCents: v("F1040.L34") - v("F1040.L37"),
        marginalRateBp: v("WS.marginalRateBp"),
        formLineValues: result.values,
        trace: result.trace,
    }
}
