import type { Decimal } from "@/lib/money/decimal"

export type BusinessType = "single" | "multiple" | "service"

export interface BreakEvenInput {
    /** Recurring fixed costs per period (rent, salaries, insurance). */
    fixedCosts: Decimal
    /** Direct cost per unit sold (materials, direct labor). */
    variableCostPerUnit: Decimal
    /** Selling price per unit. Must exceed variableCostPerUnit. */
    pricePerUnit: Decimal
    /** Used for unit-noun terminology in the UI. */
    businessType: BusinessType
    /**
     * Seasonal demand swing as a percent. Positive = peak season requires
     * more units to sustain operations; negative = low season.
     */
    seasonalityPercent: Decimal
    /**
     * Target profit expressed as a percent of fixed costs. Calculator finds
     * the unit volume that produces this profit on top of breaking even.
     */
    targetProfitPercent: Decimal
}

export interface BreakEvenResult {
    /** price − variableCost — dollars each unit contributes to fixed costs. */
    contributionMargin: Decimal
    /** contributionMargin / price × 100. */
    contributionMarginRatio: Decimal
    /** ceil(fixedCosts / contributionMargin). */
    breakEvenUnits: Decimal
    /** breakEvenUnits × pricePerUnit. */
    breakEvenRevenue: Decimal
    /** fixedCosts × targetProfitPercent / 100. */
    targetProfit: Decimal
    /** ceil((fixedCosts + targetProfit) / contributionMargin). */
    unitsForTargetProfit: Decimal
    /** breakEvenUnits × (1 + seasonalityPercent/100). */
    seasonalBreakEvenUnits: Decimal
    /** unitsForTargetProfit × (1 + seasonalityPercent/100). */
    seasonalTargetUnits: Decimal
    /** (unitsForTargetProfit − breakEvenUnits) / unitsForTargetProfit × 100. */
    marginOfSafetyPercent: Decimal
    businessType: BusinessType
}
