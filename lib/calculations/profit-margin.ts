import { Decimal, ONE, ZERO } from "@/lib/money/decimal"
import type {
    ProfitMarginInput,
    ProfitMarginResult,
} from "@/lib/types/profit-margin"

/**
 * Gross, operating, and net profit margins from revenue, COGS, OpEx, and
 * an effective tax rate.
 *
 *   grossProfit     = revenue − cogs
 *   operatingProfit = revenue − cogs − opex
 *   netProfit       = operatingProfit × (1 − tax/100)  [taxes only apply to positive operating profit]
 *
 * Each margin is the profit divided by revenue, expressed as a percent.
 * Tax is computed only on positive operating profit — operating losses
 * don't generate tax savings inside this calculator (those depend on
 * carryforwards and other-income offsets outside its scope).
 */
export function calculateProfitMargin(input: ProfitMarginInput): ProfitMarginResult {
    const { revenue, costOfGoodsSold, operatingExpenses, taxRatePercent } = input

    const grossProfit = revenue.minus(costOfGoodsSold)
    const operatingProfit = grossProfit.minus(operatingExpenses)

    const taxes = operatingProfit.gt(0)
        ? operatingProfit.times(taxRatePercent).div(100)
        : ZERO
    const netProfit = operatingProfit.gt(0)
        ? operatingProfit.times(ONE.minus(taxRatePercent.div(100)))
        : operatingProfit

    const grossMarginPercent = grossProfit.div(revenue).times(100)
    const operatingMarginPercent = operatingProfit.div(revenue).times(100)
    const netMarginPercent = netProfit.div(revenue).times(100)

    return {
        revenue,
        costOfGoodsSold,
        operatingExpenses,
        taxes,
        grossProfit,
        operatingProfit,
        netProfit,
        grossMarginPercent,
        operatingMarginPercent,
        netMarginPercent,
    }
}
