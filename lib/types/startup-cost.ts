import type { Decimal } from "@/lib/money/decimal"

export type StartupBusinessType =
    | "retail"
    | "restaurant"
    | "service"
    | "online"
    | "manufacturing"
    | "consulting"

export interface StartupCostInput {
    equipment: Decimal
    inventory: Decimal
    marketing: Decimal
    legal: Decimal
    rent: Decimal
    utilities: Decimal
    insurance: Decimal
    permits: Decimal
    website: Decimal
    employees: Decimal
    salaries: Decimal
    workingCapital: Decimal
    other: Decimal
    personalSavings: Decimal
    loanAmount: Decimal
    investorFunding: Decimal
    /** Contingency buffer as a percent of total costs. Default 20. */
    bufferPercent: Decimal
}

export interface CostCategory {
    key: string
    label: string
    value: Decimal
    /** value / totalCosts × 100. */
    percentOfTotal: Decimal
}

export interface StartupCostResult {
    /** Per-category breakdown, sorted desc by value, zero-valued categories filtered out. */
    costCategories: ReadonlyArray<CostCategory>
    totalCosts: Decimal
    /** totalCosts × bufferPercent / 100. */
    bufferAmount: Decimal
    /** totalCosts + bufferAmount. */
    totalWithBuffer: Decimal
    funding: {
        personalSavings: Decimal
        loanAmount: Decimal
        investorFunding: Decimal
    }
    totalFunding: Decimal
    /**
     * Signed gap: positive = need more funding to cover the recommended total;
     * negative = funding exceeds requirement (surplus).
     */
    fundingGap: Decimal
    /** totalFunding / totalWithBuffer × 100, clamped 0–100. */
    fundingCoveragePercent: Decimal
}
