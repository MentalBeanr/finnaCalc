import type { Decimal } from "@/lib/money/decimal"

export type PricingMode = "service" | "product"

// ---- Service ----

export interface ServicePricingInput {
    /** What you currently charge — used for scenarios and current-state metrics. */
    currentHourlyRate: Decimal
    /** Hours you bill in a typical week. */
    billableHoursPerWeek: Decimal
    /** Working weeks per year (50 is common; subtract holidays/PTO). */
    weeksPerYear: Decimal
    /** Annual business expenses (software, insurance, equipment, etc.). */
    annualExpenses: Decimal
    /** Take-home salary you want to draw from the business. */
    desiredSalary: Decimal
    /** Effective tax rate on profit, as a percent. */
    taxRatePercent: Decimal
}

export interface ServicePricingScenario {
    name: string
    rate: Decimal
    annualRevenue: Decimal
    netIncome: Decimal
}

export interface ServicePricingResult {
    kind: "service"
    totalBillableHours: Decimal
    /** rate × hours at the current rate. */
    annualRevenueAtCurrent: Decimal
    /** (revenue − expenses) × (1 − tax/100) at the current rate. */
    netIncomeAtCurrent: Decimal
    /** Rate needed to hit desiredSalary after expenses and taxes. */
    requiredHourlyRate: Decimal
    /** Rate at which the business breaks even on expenses (no salary). */
    breakEvenHourlyRate: Decimal
    scenarios: ReadonlyArray<ServicePricingScenario>
}

// ---- Product ----

export interface ProductPricingInput {
    /** Unit cost. */
    productCost: Decimal
    /** Target margin (profit / sellingPrice) as a percent. 0–99. */
    desiredMarginPercent: Decimal
    /** Optional competitor price for relative positioning. 0 to skip. */
    competitorPrice: Decimal
    /** Volume discount on the selling price, as a percent. 0–99. */
    volumeDiscountPercent: Decimal
    /** Optional shipping cost added to the selling price. */
    shippingCost: Decimal
}

export type CompetitorPosition = "below" | "above" | "match"

export interface CompetitorComparison {
    competitorPrice: Decimal
    /** (competitor − selling) / competitor × 100. Positive = we're cheaper. */
    differencePercent: Decimal
    position: CompetitorPosition
}

export interface ProductPricingStrategy {
    name: string
    price: Decimal
    profit: Decimal
    marginPercent: Decimal
}

export interface ProductPricingResult {
    kind: "product"
    cost: Decimal
    /** cost / (1 − margin/100). */
    sellingPrice: Decimal
    profitPerUnit: Decimal
    /** profit / cost × 100. */
    markupPercent: Decimal
    /** Input echoed for display. */
    marginPercent: Decimal
    priceWithShipping: Decimal
    volumePrice: Decimal
    volumeProfit: Decimal
    competitorComparison: CompetitorComparison | null
    strategies: ReadonlyArray<ProductPricingStrategy>
}

export type PricingResult = ServicePricingResult | ProductPricingResult
