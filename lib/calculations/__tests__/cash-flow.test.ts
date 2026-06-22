import { describe, expect, it } from "vitest"
import { D, Decimal as DecimalCtor } from "@/lib/money/decimal"
import { calculateCashFlow } from "@/lib/calculations/cash-flow"

const round = (value: DecimalCtor, dp: number) => value.toFixed(dp)

describe("calculateCashFlow", () => {
    it("projects a flat-revenue business with 12 months at zero growth", () => {
        const r = calculateCashFlow({
            monthlyRevenue: D(25000),
            monthlyExpenses: D(20000),
            startingCash: D(50000),
            monthlyGrowthPercent: D(0),
            months: D(12),
        })
        expect(r.projections.length).toBe(12)
        // Every month: 25k revenue, 20k expenses, 5k net
        expect(r.projections[0].netCashFlow.toString()).toBe("5000")
        expect(r.projections[11].netCashFlow.toString()).toBe("5000")
        // Cumulative grows linearly: 50k + 5k*12 = 110k
        expect(r.finalCash.toString()).toBe("110000")
        expect(r.totalRevenue.toString()).toBe("300000")
        expect(r.totalExpenses.toString()).toBe("240000")
        expect(r.runwayMonths).toBeNull()
    })

    it("compounds revenue growth month over month", () => {
        const r = calculateCashFlow({
            monthlyRevenue: D(10000),
            monthlyExpenses: D(0),
            startingCash: D(0),
            monthlyGrowthPercent: D(10),
            months: D(3),
        })
        // Month 1: 10000; Month 2: 11000; Month 3: 12100
        expect(round(r.projections[0].revenue, 2)).toBe("10000.00")
        expect(round(r.projections[1].revenue, 2)).toBe("11000.00")
        expect(round(r.projections[2].revenue, 2)).toBe("12100.00")
    })

    it("reports runway month when cumulative cash crosses below zero", () => {
        const r = calculateCashFlow({
            monthlyRevenue: D(5000),
            monthlyExpenses: D(10000),
            startingCash: D(12000),
            monthlyGrowthPercent: D(0),
            months: D(12),
        })
        // Net = -5000/month; starting 12000:
        // m1: 7000, m2: 2000, m3: -3000 (runway = 3)
        expect(r.runwayMonths).toBe(3)
        expect(round(r.projections[2].cumulativeCash, 2)).toBe("-3000.00")
    })

    it("stays solvent and reports null runway when net cash flow is positive", () => {
        const r = calculateCashFlow({
            monthlyRevenue: D(15000),
            monthlyExpenses: D(10000),
            startingCash: D(5000),
            monthlyGrowthPercent: D(0),
            months: D(6),
        })
        expect(r.runwayMonths).toBeNull()
        expect(r.finalCash.gt(D(0))).toBe(true)
    })

    it("computes mean monthly net cash flow over the horizon", () => {
        const r = calculateCashFlow({
            monthlyRevenue: D(20000),
            monthlyExpenses: D(15000),
            startingCash: D(0),
            monthlyGrowthPercent: D(0),
            months: D(6),
        })
        // 5000 × 6 = 30000 net; avg = 5000
        expect(r.averageMonthlyNetCashFlow.toString()).toBe("5000")
    })

    it("handles a horizon of one month", () => {
        const r = calculateCashFlow({
            monthlyRevenue: D(8000),
            monthlyExpenses: D(5000),
            startingCash: D(1000),
            monthlyGrowthPercent: D(5),
            months: D(1),
        })
        expect(r.projections.length).toBe(1)
        expect(r.projections[0].revenue.toString()).toBe("8000")
        expect(r.finalCash.toString()).toBe("4000")
    })
})
