import { D, Decimal, ONE, ZERO } from "@/lib/money/decimal"
import type {
    CompetitorComparison,
    CompetitorPosition,
    ProductPricingInput,
    ProductPricingResult,
    ProductPricingStrategy,
    ServicePricingInput,
    ServicePricingResult,
} from "@/lib/types/pricing"

/**
 * Service pricing — annual revenue, current net income, the rate needed to
 * draw a target salary, and the rate that just covers expenses.
 *
 *   billable_hours      = hoursPerWeek × weeksPerYear
 *   annualRevenue(rate) = rate × billable_hours
 *   netIncome(rate)     = (annualRevenue(rate) − expenses) × (1 − tax/100)  [taxes only on profit]
 *
 * Solving netIncome(required) = desiredSalary:
 *   required = (desiredSalary / (1 − tax/100) + expenses) / billable_hours
 *
 * Scenario rates: 0.8×, 1.0×, 1.2×, 1.5× of current — useful for sanity-checking
 * a planned price change before committing to it.
 */
export function calculateServicePricing(input: ServicePricingInput): ServicePricingResult {
    const {
        currentHourlyRate,
        billableHoursPerWeek,
        weeksPerYear,
        annualExpenses,
        desiredSalary,
        taxRatePercent,
    } = input

    const totalBillableHours = billableHoursPerWeek.times(weeksPerYear)
    const taxMultiplier = ONE.minus(taxRatePercent.div(100))

    const annualRevenueAtCurrent = currentHourlyRate.times(totalBillableHours)
    const grossAtCurrent = annualRevenueAtCurrent.minus(annualExpenses)
    const netIncomeAtCurrent = grossAtCurrent.gt(0)
        ? grossAtCurrent.times(taxMultiplier)
        : grossAtCurrent

    const requiredHourlyRate = totalBillableHours.gt(0) && taxMultiplier.gt(0)
        ? desiredSalary.div(taxMultiplier).plus(annualExpenses).div(totalBillableHours)
        : ZERO
    const breakEvenHourlyRate = totalBillableHours.gt(0)
        ? annualExpenses.div(totalBillableHours)
        : ZERO

    const scenarioMultipliers: Array<{ name: string; multiplier: Decimal }> = [
        { name: "Conservative", multiplier: D(0.8) },
        { name: "Current", multiplier: ONE },
        { name: "Optimistic", multiplier: D(1.2) },
        { name: "Premium", multiplier: D(1.5) },
    ]
    const scenarios = scenarioMultipliers.map(({ name, multiplier }) => {
        const rate = currentHourlyRate.times(multiplier)
        const annualRevenue = rate.times(totalBillableHours)
        const gross = annualRevenue.minus(annualExpenses)
        const netIncome = gross.gt(0) ? gross.times(taxMultiplier) : gross
        return { name, rate, annualRevenue, netIncome }
    })

    return {
        kind: "service",
        totalBillableHours,
        annualRevenueAtCurrent,
        netIncomeAtCurrent,
        requiredHourlyRate,
        breakEvenHourlyRate,
        scenarios,
    }
}

/**
 * Product pricing — cost-plus selling price derived from a target margin,
 * with optional competitive comparison and standard strategy comparisons.
 *
 *   sellingPrice  = cost / (1 − margin/100)
 *   markup        = profit / cost × 100
 *   volumePrice   = sellingPrice × (1 − discount/100)
 *
 * Validator enforces margin < 100% (since cost/(1-1) diverges).
 */
export function calculateProductPricing(input: ProductPricingInput): ProductPricingResult {
    const {
        productCost,
        desiredMarginPercent,
        competitorPrice,
        volumeDiscountPercent,
        shippingCost,
    } = input

    const marginRatio = desiredMarginPercent.div(100)
    const sellingPrice = ONE.minus(marginRatio).isZero()
        ? ZERO
        : productCost.div(ONE.minus(marginRatio))
    const profitPerUnit = sellingPrice.minus(productCost)
    const markupPercent = productCost.gt(0)
        ? profitPerUnit.div(productCost).times(100)
        : ZERO
    const priceWithShipping = sellingPrice.plus(shippingCost)
    const volumePrice = sellingPrice.times(ONE.minus(volumeDiscountPercent.div(100)))
    const volumeProfit = volumePrice.minus(productCost)

    let competitorComparison: CompetitorComparison | null = null
    if (competitorPrice.gt(0)) {
        const diff = competitorPrice.minus(sellingPrice)
        const position: CompetitorPosition =
            sellingPrice.lt(competitorPrice)
                ? "below"
                : sellingPrice.gt(competitorPrice)
                    ? "above"
                    : "match"
        competitorComparison = {
            competitorPrice,
            differencePercent: diff.div(competitorPrice).times(100),
            position,
        }
    }

    const strategiesRaw: Array<{ name: string; price: Decimal }> = [
        { name: "Cost-Plus", price: sellingPrice },
        { name: "Premium", price: sellingPrice.times(D(1.3)) },
        { name: "Penetration", price: sellingPrice.times(D(0.8)) },
    ]
    if (competitorPrice.gt(0)) {
        strategiesRaw.push({
            name: "Competitive",
            price: competitorPrice.times(D(0.95)),
        })
    }
    const strategies: ProductPricingStrategy[] = strategiesRaw.map((s) => ({
        name: s.name,
        price: s.price,
        profit: s.price.minus(productCost),
        marginPercent: s.price.gt(0)
            ? s.price.minus(productCost).div(s.price).times(100)
            : ZERO,
    }))

    return {
        kind: "product",
        cost: productCost,
        sellingPrice,
        profitPerUnit,
        markupPercent,
        marginPercent: desiredMarginPercent,
        priceWithShipping,
        volumePrice,
        volumeProfit,
        competitorComparison,
        strategies,
    }
}
