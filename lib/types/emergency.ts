import type { Decimal } from "@/lib/money/decimal"

export type EmergencyTargetType = "months" | "amount"

export interface EmergencyInput {
    /** Monthly fixed expenses to be covered by the fund. */
    monthlyExpenses: Decimal
    /** Existing balance in the fund. */
    currentSavings: Decimal
    /**
     * How the target is expressed: months of expenses, or an explicit dollar amount.
     */
    targetType: EmergencyTargetType
    /**
     * If targetType is `months`, the number of months of expenses to cover.
     * If `amount`, the explicit dollar target.
     */
    targetValue: Decimal
    /** Monthly contribution toward the goal. */
    monthlyContribution: Decimal
    /** Annual interest rate on the savings vehicle (APR), as a percent. */
    annualRatePercent: Decimal
}

export interface EmergencyResult {
    /** The dollar target derived from inputs. */
    targetAmount: Decimal
    /** max(0, target − current). */
    stillNeeded: Decimal
    /** Clamped 0–100. */
    percentComplete: Decimal
    /** current / monthlyExpenses — current runway in months. */
    monthsCovered: Decimal
    /**
     * Months to reach the target via existing balance growth + monthly
     * contributions. 0 if already at or past the target. Infinity-equivalent
     * (returned as null) if no contributions and the existing balance won't
     * compound to the target.
     */
    timeToGoalMonths: Decimal | null
    /** Sum of contributions over timeToGoalMonths. */
    principalContributed: Decimal
    /** target − current − principalContributed (interest on existing + on contributions). */
    interestEarned: Decimal
}
