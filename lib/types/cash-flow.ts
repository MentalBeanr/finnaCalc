import type { Decimal } from "@/lib/money/decimal"

export interface CashFlowInput {
    /** Revenue in the first projected month. */
    monthlyRevenue: Decimal
    /** Fixed monthly expenses (held constant across the projection). */
    monthlyExpenses: Decimal
    /** Cash on hand at the start of month 1. */
    startingCash: Decimal
    /** Compound monthly revenue growth as a percent. Can be 0 or negative. */
    monthlyGrowthPercent: Decimal
    /** Projection horizon in whole months. */
    months: Decimal
}

export interface CashFlowMonth {
    month: number
    revenue: Decimal
    expenses: Decimal
    netCashFlow: Decimal
    cumulativeCash: Decimal
}

export interface CashFlowResult {
    projections: CashFlowMonth[]
    /** Sum of revenue across the projection horizon. */
    totalRevenue: Decimal
    /** Sum of expenses across the projection horizon. */
    totalExpenses: Decimal
    /** projections[last].cumulativeCash. */
    finalCash: Decimal
    /** totalRevenue − totalExpenses (independent of starting cash). */
    netCashFlow: Decimal
    /** Mean monthly net cash flow. */
    averageMonthlyNetCashFlow: Decimal
    /**
     * Month index (1-based) at which cumulativeCash first goes negative.
     * null if the projection stays solvent the entire horizon.
     */
    runwayMonths: number | null
}
