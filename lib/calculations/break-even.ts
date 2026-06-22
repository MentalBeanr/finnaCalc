import { D, Decimal, ONE, ZERO } from "@/lib/money/decimal"
import type { BreakEvenInput, BreakEvenResult } from "@/lib/types/break-even"

/**
 * Break-even analysis for a single-unit business model.
 *
 *   contributionMargin = price − variableCost
 *   breakEvenUnits     = fixedCosts / contributionMargin       (ceiling — partial units don't pay rent)
 *   breakEvenRevenue   = breakEvenUnits × price
 *   unitsForTargetProfit = (fixedCosts + targetProfit) / contributionMargin
 *
 * Seasonality scales both break-even and target unit counts by (1 + s/100)
 * — a +20% seasonal factor means peak-season operations need 20% more units
 * to hit the same financial floor.
 *
 * Margin of safety: how much sales can fall (in percent of the target-profit
 * volume) before profit disappears entirely.
 *
 * Precondition: pricePerUnit > variableCostPerUnit (enforced by validator).
 */
export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
    const {
        fixedCosts,
        variableCostPerUnit,
        pricePerUnit,
        businessType,
        seasonalityPercent,
        targetProfitPercent,
    } = input

    const contributionMargin = pricePerUnit.minus(variableCostPerUnit)
    const contributionMarginRatio = contributionMargin.div(pricePerUnit).times(100)

    const rawBreakEvenUnits = fixedCosts.div(contributionMargin)
    const breakEvenUnits = ceilDecimal(rawBreakEvenUnits)
    const breakEvenRevenue = breakEvenUnits.times(pricePerUnit)

    const targetProfit = fixedCosts.times(targetProfitPercent).div(100)
    const rawTargetUnits = fixedCosts.plus(targetProfit).div(contributionMargin)
    const unitsForTargetProfit = ceilDecimal(rawTargetUnits)

    const seasonalityMultiplier = ONE.plus(seasonalityPercent.div(100))
    const seasonalBreakEvenUnits = ceilDecimal(
        rawBreakEvenUnits.times(seasonalityMultiplier),
    )
    const seasonalTargetUnits = ceilDecimal(
        rawTargetUnits.times(seasonalityMultiplier),
    )

    const marginOfSafetyPercent = unitsForTargetProfit.gt(0)
        ? unitsForTargetProfit
              .minus(breakEvenUnits)
              .div(unitsForTargetProfit)
              .times(100)
        : ZERO

    return {
        contributionMargin,
        contributionMarginRatio,
        breakEvenUnits,
        breakEvenRevenue,
        targetProfit,
        unitsForTargetProfit,
        seasonalBreakEvenUnits,
        seasonalTargetUnits,
        marginOfSafetyPercent,
        businessType,
    }
}

function ceilDecimal(value: Decimal): Decimal {
    return D(Math.ceil(value.toNumber()))
}
