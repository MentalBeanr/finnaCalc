import { D, Decimal, ONE, ZERO } from "@/lib/money/decimal"
import type {
    CashFlowInput,
    CashFlowMonth,
    CashFlowResult,
} from "@/lib/types/cash-flow"

/**
 * Month-by-month cash flow projection with compounding revenue growth.
 *
 * For each month t ∈ [1, months]:
 *   revenue_t        = monthlyRevenue × (1 + g)^(t−1)
 *   expenses_t       = monthlyExpenses
 *   netCashFlow_t    = revenue_t − expenses_t
 *   cumulativeCash_t = cumulativeCash_{t−1} + netCashFlow_t
 *
 * Where cumulativeCash_0 = startingCash and g = monthlyGrowthPercent / 100.
 *
 * Runway: the first month at which cumulativeCash crosses below zero.
 * Reported as the month index (1-based) so it answers "by what month do we
 * run out?" If the projection stays solvent, runwayMonths is null.
 */
export function calculateCashFlow(input: CashFlowInput): CashFlowResult {
    const {
        monthlyRevenue,
        monthlyExpenses,
        startingCash,
        monthlyGrowthPercent,
        months,
    } = input

    const horizon = Math.max(0, Math.floor(months.toNumber()))
    const growthMultiplier = ONE.plus(monthlyGrowthPercent.div(100))

    const projections: CashFlowMonth[] = []
    let currentRevenue = monthlyRevenue
    let cumulativeCash = startingCash
    let totalRevenue = ZERO
    let totalExpenses = ZERO
    let runwayMonths: number | null = null

    for (let m = 1; m <= horizon; m++) {
        const revenue = currentRevenue
        const expenses = monthlyExpenses
        const netCashFlow = revenue.minus(expenses)
        cumulativeCash = cumulativeCash.plus(netCashFlow)
        totalRevenue = totalRevenue.plus(revenue)
        totalExpenses = totalExpenses.plus(expenses)

        if (runwayMonths === null && cumulativeCash.lt(ZERO)) {
            runwayMonths = m
        }

        projections.push({
            month: m,
            revenue,
            expenses,
            netCashFlow,
            cumulativeCash,
        })

        currentRevenue = currentRevenue.times(growthMultiplier)
    }

    const finalCash = projections.length > 0
        ? projections[projections.length - 1].cumulativeCash
        : startingCash
    const netCashFlow = totalRevenue.minus(totalExpenses)
    const averageMonthlyNetCashFlow = horizon > 0
        ? netCashFlow.div(D(horizon))
        : ZERO

    return {
        projections,
        totalRevenue,
        totalExpenses,
        finalCash,
        netCashFlow,
        averageMonthlyNetCashFlow,
        runwayMonths,
    }
}
