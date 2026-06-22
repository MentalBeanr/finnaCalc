import type { Decimal } from "@/lib/money/decimal"

export interface ProfitMarginInput {
    /** Total sales revenue for the period. Must be > 0. */
    revenue: Decimal
    /** Direct costs to produce goods/services. */
    costOfGoodsSold: Decimal
    /** Indirect operating costs (rent, salaries, marketing). */
    operatingExpenses: Decimal
    /** Effective income tax rate as a percent. */
    taxRatePercent: Decimal
}

export interface ProfitMarginResult {
    revenue: Decimal
    costOfGoodsSold: Decimal
    operatingExpenses: Decimal
    taxes: Decimal
    /** revenue − cogs. */
    grossProfit: Decimal
    /** revenue − cogs − opex. */
    operatingProfit: Decimal
    /** operatingProfit × (1 − tax/100). */
    netProfit: Decimal
    /** grossProfit / revenue × 100. */
    grossMarginPercent: Decimal
    /** operatingProfit / revenue × 100. */
    operatingMarginPercent: Decimal
    /** netProfit / revenue × 100. */
    netMarginPercent: Decimal
}
