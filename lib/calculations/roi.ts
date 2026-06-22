import { D, Decimal, ONE, ZERO } from "@/lib/money/decimal"
import type { RoiInput, RoiResult } from "@/lib/types/roi"

/**
 * Return on Investment, with optional annualization, income (dividend)
 * yield, taxes, and inflation adjustment.
 *
 * All math is decimal-safe. Edge cases:
 * - timeYears = 0: annualized degenerates; we require > 0 at the validator.
 * - finalValue < initialInvestment: totalReturn is negative, capital gains tax
 *   is 0 (no tax on losses); annualized may be negative.
 *
 * Annualization:
 *   simple:     annualized = totalRoi / years
 *   annualized: annualized = (final/initial)^(1/years) - 1 (CAGR)
 *
 * Real return uses the Fisher equation:
 *   realRate = (1 + nominal) / (1 + inflation) - 1
 */
export function calculateRoi(input: RoiInput): RoiResult {
    const {
        initialInvestment,
        finalValue,
        timeYears,
        method,
        dividendYieldPercent,
        inflationPercent,
        taxRatePercent,
    } = input

    const totalReturn = finalValue.minus(initialInvestment)
    const totalRoiPercent = totalReturn.div(initialInvestment).times(100)

    const annualizedRoiPercent = (() => {
        if (method === "simple") {
            return totalRoiPercent.div(timeYears)
        }
        // CAGR via floating-point pow; preserve sign of the ratio
        const ratio = finalValue.div(initialInvestment)
        if (ratio.lte(0)) {
            // Investment wiped out — return -100% annualized
            return D(-100)
        }
        const cagr = D(Math.pow(ratio.toNumber(), 1 / timeYears.toNumber())).minus(ONE)
        return cagr.times(100)
    })()

    const annualDividendIncome = initialInvestment.times(dividendYieldPercent).div(100)
    const totalDividendIncome = annualDividendIncome.times(timeYears)

    const taxRate = taxRatePercent.div(100)
    const capitalGainsTax = totalReturn.gt(0) ? totalReturn.times(taxRate) : ZERO
    const incomeTax = totalDividendIncome.times(taxRate)
    const totalTax = capitalGainsTax.plus(incomeTax)

    const afterTaxReturn = totalReturn.plus(totalDividendIncome).minus(totalTax)

    // Fisher: (1 + nominal) / (1 + inflation) - 1
    const nominal = annualizedRoiPercent.div(100)
    const inflation = inflationPercent.div(100)
    const realRate = ONE.plus(nominal).div(ONE.plus(inflation)).minus(ONE)
    const realAnnualizedRoiPercent = realRate.times(100)
    const realFinalValue = initialInvestment.times(
        D(Math.pow(ONE.plus(realRate).toNumber(), timeYears.toNumber())),
    )

    return {
        initialInvestment,
        finalValue,
        timeYears,
        totalReturn,
        totalRoiPercent,
        annualizedRoiPercent,
        totalDividendIncome,
        capitalGainsTax,
        incomeTax,
        totalTax,
        afterTaxReturn,
        realAnnualizedRoiPercent,
        realFinalValue,
    }
}
