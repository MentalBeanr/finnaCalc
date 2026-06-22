import { describe, expect, it } from "vitest"
import { D, Decimal as DecimalCtor } from "@/lib/money/decimal"
import {
    calculateProductPricing,
    calculateServicePricing,
} from "@/lib/calculations/pricing"

const round = (value: DecimalCtor, dp: number) => value.toFixed(dp)

describe("calculateServicePricing", () => {
    it("computes annual revenue and net income at the current rate", () => {
        const r = calculateServicePricing({
            currentHourlyRate: D(100),
            billableHoursPerWeek: D(30),
            weeksPerYear: D(50),
            annualExpenses: D(25000),
            desiredSalary: D(80000),
            taxRatePercent: D(25),
        })
        // hours = 1500; revenue = 150000; gross = 125000; net = 93750
        expect(r.totalBillableHours.toString()).toBe("1500")
        expect(r.annualRevenueAtCurrent.toString()).toBe("150000")
        expect(round(r.netIncomeAtCurrent, 2)).toBe("93750.00")
    })

    it("solves for the required hourly rate that hits the desired salary", () => {
        const r = calculateServicePricing({
            currentHourlyRate: D(100),
            billableHoursPerWeek: D(30),
            weeksPerYear: D(50),
            annualExpenses: D(25000),
            desiredSalary: D(80000),
            taxRatePercent: D(25),
        })
        // required = (80000/0.75 + 25000) / 1500 = (106666.67 + 25000) / 1500 ≈ 87.78
        expect(round(r.requiredHourlyRate, 2)).toBe("87.78")
    })

    it("break-even rate just covers expenses", () => {
        const r = calculateServicePricing({
            currentHourlyRate: D(100),
            billableHoursPerWeek: D(40),
            weeksPerYear: D(50),
            annualExpenses: D(20000),
            desiredSalary: D(0),
            taxRatePercent: D(0),
        })
        // breakEven = 20000 / 2000 = 10
        expect(r.breakEvenHourlyRate.toString()).toBe("10")
    })

    it("produces four ordered scenarios with monotonically rising revenue", () => {
        const r = calculateServicePricing({
            currentHourlyRate: D(100),
            billableHoursPerWeek: D(30),
            weeksPerYear: D(50),
            annualExpenses: D(25000),
            desiredSalary: D(80000),
            taxRatePercent: D(25),
        })
        expect(r.scenarios.length).toBe(4)
        expect(r.scenarios.map((s) => s.name)).toEqual([
            "Conservative",
            "Current",
            "Optimistic",
            "Premium",
        ])
        for (let i = 1; i < r.scenarios.length; i++) {
            expect(r.scenarios[i].annualRevenue.gt(r.scenarios[i - 1].annualRevenue)).toBe(true)
        }
    })
})

describe("calculateProductPricing", () => {
    it("derives selling price from cost and target margin", () => {
        const r = calculateProductPricing({
            productCost: D(25),
            desiredMarginPercent: D(50),
            competitorPrice: D(0),
            volumeDiscountPercent: D(0),
            shippingCost: D(0),
        })
        // 25 / (1 - 0.5) = 50; profit = 25; markup = 100%
        expect(r.sellingPrice.toString()).toBe("50")
        expect(r.profitPerUnit.toString()).toBe("25")
        expect(r.markupPercent.toString()).toBe("100")
    })

    it("applies volume discount to the selling price", () => {
        const r = calculateProductPricing({
            productCost: D(40),
            desiredMarginPercent: D(60),
            competitorPrice: D(0),
            volumeDiscountPercent: D(10),
            shippingCost: D(0),
        })
        // selling = 100, volume = 90
        expect(r.sellingPrice.toString()).toBe("100")
        expect(r.volumePrice.toString()).toBe("90")
        expect(r.volumeProfit.toString()).toBe("50")
    })

    it("compares position against competitor when provided", () => {
        const lower = calculateProductPricing({
            productCost: D(30),
            desiredMarginPercent: D(50),
            competitorPrice: D(75),
            volumeDiscountPercent: D(0),
            shippingCost: D(0),
        })
        // selling = 60; competitor = 75; we're below by 20%
        expect(lower.competitorComparison?.position).toBe("below")
        expect(round(lower.competitorComparison!.differencePercent, 2)).toBe("20.00")

        const higher = calculateProductPricing({
            productCost: D(30),
            desiredMarginPercent: D(60),
            competitorPrice: D(50),
            volumeDiscountPercent: D(0),
            shippingCost: D(0),
        })
        // selling = 75; competitor = 50; we're above
        expect(higher.competitorComparison?.position).toBe("above")
    })

    it("returns null competitor comparison when competitor price is 0", () => {
        const r = calculateProductPricing({
            productCost: D(20),
            desiredMarginPercent: D(40),
            competitorPrice: D(0),
            volumeDiscountPercent: D(0),
            shippingCost: D(0),
        })
        expect(r.competitorComparison).toBeNull()
    })

    it("includes Competitive strategy only when competitor price > 0", () => {
        const withComp = calculateProductPricing({
            productCost: D(20),
            desiredMarginPercent: D(40),
            competitorPrice: D(50),
            volumeDiscountPercent: D(0),
            shippingCost: D(0),
        })
        const withoutComp = calculateProductPricing({
            productCost: D(20),
            desiredMarginPercent: D(40),
            competitorPrice: D(0),
            volumeDiscountPercent: D(0),
            shippingCost: D(0),
        })
        expect(withComp.strategies.map((s) => s.name)).toContain("Competitive")
        expect(withoutComp.strategies.map((s) => s.name)).not.toContain("Competitive")
    })
})
