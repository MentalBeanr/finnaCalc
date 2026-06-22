import type { Decimal } from "@/lib/money/decimal"

export type RoiMethod = "simple" | "annualized"

export interface RoiInput {
    /** Initial outlay. Must be > 0. */
    initialInvestment: Decimal
    /** Final value of the investment. */
    finalValue: Decimal
    /** Holding period in years. Must be > 0. */
    timeYears: Decimal
    /** How annualized ROI is reported: simple = linear; annualized = geometric (CAGR). */
    method: RoiMethod
    /** Annual income yield as a percent (e.g. dividends). 0 if none. */
    dividendYieldPercent: Decimal
    /** Expected annual inflation as a percent. */
    inflationPercent: Decimal
    /** Tax rate on realized gains and income, as a percent. */
    taxRatePercent: Decimal
}

export interface RoiResult {
    initialInvestment: Decimal
    finalValue: Decimal
    timeYears: Decimal
    /** finalValue - initialInvestment. */
    totalReturn: Decimal
    /** totalReturn / initialInvestment * 100. */
    totalRoiPercent: Decimal
    /** Per the method: linear or CAGR. */
    annualizedRoiPercent: Decimal
    /** Cumulative dividend / income payments over the holding period. */
    totalDividendIncome: Decimal
    /** Tax on the capital gain (only on positive returns). */
    capitalGainsTax: Decimal
    /** Tax on the income payments. */
    incomeTax: Decimal
    /** capitalGainsTax + incomeTax. */
    totalTax: Decimal
    /** totalReturn + totalDividendIncome - totalTax. */
    afterTaxReturn: Decimal
    /** Fisher-equation real (inflation-adjusted) annualized return: (1+r)/(1+i) - 1, as a percent. */
    realAnnualizedRoiPercent: Decimal
    /** Initial × (1 + realRate)^years. */
    realFinalValue: Decimal
}
