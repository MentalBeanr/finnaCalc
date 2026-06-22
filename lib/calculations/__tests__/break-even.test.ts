import { describe, expect, it } from "vitest"
import { D, Decimal as DecimalCtor } from "@/lib/money/decimal"
import { calculateBreakEven } from "@/lib/calculations/break-even"

const round = (value: DecimalCtor, dp: number) => value.toFixed(dp)

describe("calculateBreakEven", () => {
    it("computes textbook break-even — $10k fixed, $50 price, $25 variable", () => {
        const r = calculateBreakEven({
            fixedCosts: D(10000),
            variableCostPerUnit: D(25),
            pricePerUnit: D(50),
            businessType: "single",
            seasonalityPercent: D(0),
            targetProfitPercent: D(0),
        })
        // contribution margin = 50 - 25 = 25; break-even = 10000/25 = 400 units
        expect(r.contributionMargin.toString()).toBe("25")
        expect(r.contributionMarginRatio.toString()).toBe("50")
        expect(r.breakEvenUnits.toString()).toBe("400")
        expect(r.breakEvenRevenue.toString()).toBe("20000")
    })

    it("rounds break-even units up — partial units don't pay fixed costs", () => {
        const r = calculateBreakEven({
            fixedCosts: D(10001),
            variableCostPerUnit: D(25),
            pricePerUnit: D(50),
            businessType: "single",
            seasonalityPercent: D(0),
            targetProfitPercent: D(0),
        })
        // 10001 / 25 = 400.04 → ceil to 401
        expect(r.breakEvenUnits.toString()).toBe("401")
    })

    it("scales the target-profit volume by the target profit percent", () => {
        const r = calculateBreakEven({
            fixedCosts: D(10000),
            variableCostPerUnit: D(25),
            pricePerUnit: D(50),
            businessType: "single",
            seasonalityPercent: D(0),
            targetProfitPercent: D(20),
        })
        // target profit = 10000 * 0.20 = 2000; total to cover = 12000
        // 12000 / 25 = 480 units
        expect(r.targetProfit.toString()).toBe("2000")
        expect(r.unitsForTargetProfit.toString()).toBe("480")
    })

    it("scales unit counts by the seasonality multiplier", () => {
        const peak = calculateBreakEven({
            fixedCosts: D(10000),
            variableCostPerUnit: D(25),
            pricePerUnit: D(50),
            businessType: "single",
            seasonalityPercent: D(20),
            targetProfitPercent: D(0),
        })
        // 400 * 1.20 = 480
        expect(peak.seasonalBreakEvenUnits.toString()).toBe("480")
    })

    it("computes margin of safety from break-even to target volume", () => {
        const r = calculateBreakEven({
            fixedCosts: D(10000),
            variableCostPerUnit: D(25),
            pricePerUnit: D(50),
            businessType: "single",
            seasonalityPercent: D(0),
            targetProfitPercent: D(50),
        })
        // break-even = 400, target = (10000 + 5000)/25 = 600
        // safety = (600 - 400) / 600 * 100 ≈ 33.33%
        expect(Number(round(r.marginOfSafetyPercent, 2))).toBeCloseTo(33.33, 1)
    })

    it("contribution-margin ratio reflects the price-cost spread", () => {
        const r = calculateBreakEven({
            fixedCosts: D(5000),
            variableCostPerUnit: D(60),
            pricePerUnit: D(100),
            businessType: "single",
            seasonalityPercent: D(0),
            targetProfitPercent: D(0),
        })
        // CM = 40; ratio = 40%; break-even = 5000 / 40 = 125 units
        expect(r.contributionMarginRatio.toString()).toBe("40")
        expect(r.breakEvenUnits.toString()).toBe("125")
    })
})
