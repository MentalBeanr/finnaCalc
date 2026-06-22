import { describe, expect, it } from "vitest"
import { D, Decimal as DecimalCtor } from "@/lib/money/decimal"
import { calculateStartupCost } from "@/lib/calculations/startup-cost"
import type { StartupCostInput } from "@/lib/types/startup-cost"

const round = (value: DecimalCtor, dp: number) => value.toFixed(dp)

const baseInput: StartupCostInput = {
    equipment: D(10000),
    inventory: D(5000),
    marketing: D(3000),
    legal: D(2000),
    rent: D(6000),
    utilities: D(1000),
    insurance: D(2000),
    permits: D(500),
    website: D(2000),
    employees: D(0),
    salaries: D(0),
    workingCapital: D(8000),
    other: D(0),
    personalSavings: D(20000),
    loanAmount: D(15000),
    investorFunding: D(0),
    bufferPercent: D(20),
}

describe("calculateStartupCost", () => {
    it("sums all cost categories into totalCosts", () => {
        const r = calculateStartupCost(baseInput)
        // 10000 + 5000 + 3000 + 2000 + 6000 + 1000 + 2000 + 500 + 2000 + 0 + 0 + 8000 + 0 = 39500
        expect(r.totalCosts.toString()).toBe("39500")
    })

    it("applies the contingency buffer percent", () => {
        const r = calculateStartupCost(baseInput)
        // 20% of 39500 = 7900; total with buffer = 47400
        expect(r.bufferAmount.toString()).toBe("7900")
        expect(r.totalWithBuffer.toString()).toBe("47400")
    })

    it("computes a positive funding gap when funding < requirement", () => {
        const r = calculateStartupCost(baseInput)
        // funding = 35000; gap = 47400 - 35000 = 12400
        expect(r.totalFunding.toString()).toBe("35000")
        expect(r.fundingGap.toString()).toBe("12400")
    })

    it("computes a negative funding gap when overfunded", () => {
        const r = calculateStartupCost({
            ...baseInput,
            personalSavings: D(50000),
            loanAmount: D(20000),
            investorFunding: D(10000),
        })
        // funding 80000 - required 47400 = -32600 gap (surplus)
        expect(r.fundingGap.toString()).toBe("-32600")
    })

    it("clamps coverage percent at 100 when overfunded", () => {
        const r = calculateStartupCost({
            ...baseInput,
            personalSavings: D(200000),
        })
        expect(r.fundingCoveragePercent.toString()).toBe("100")
    })

    it("category percentages sum to 100 (when totalCosts > 0)", () => {
        const r = calculateStartupCost(baseInput)
        const sum = r.costCategories.reduce(
            (acc, c) => acc.plus(c.percentOfTotal),
            D(0),
        )
        // Floating-point safe: should be 100 to 6 decimals
        expect(round(sum, 6)).toBe("100.000000")
    })

    it("filters out zero-value categories and sorts desc by value", () => {
        const r = calculateStartupCost(baseInput)
        // No category should have value 0
        expect(r.costCategories.every((c) => c.value.gt(0))).toBe(true)
        // Should be sorted descending
        for (let i = 1; i < r.costCategories.length; i++) {
            expect(
                r.costCategories[i].value.lte(r.costCategories[i - 1].value),
            ).toBe(true)
        }
    })
})
