import { describe, expect, it } from "vitest"
import { D } from "@/lib/money/decimal"
import { calculateEmergency } from "@/lib/calculations/emergency"

describe("calculateEmergency", () => {
    it("computes target as months × expenses", () => {
        const r = calculateEmergency({
            monthlyExpenses: D(5000),
            currentSavings: D(0),
            targetType: "months",
            targetValue: D(6),
            monthlyContribution: D(0),
            annualRatePercent: D(0),
        })
        expect(r.targetAmount.toString()).toBe("30000")
    })

    it("uses an explicit target amount when targetType is amount", () => {
        const r = calculateEmergency({
            monthlyExpenses: D(5000),
            currentSavings: D(10000),
            targetType: "amount",
            targetValue: D(25000),
            monthlyContribution: D(0),
            annualRatePercent: D(0),
        })
        expect(r.targetAmount.toString()).toBe("25000")
        expect(r.stillNeeded.toString()).toBe("15000")
        expect(r.percentComplete.toString()).toBe("40")
        expect(r.monthsCovered.toString()).toBe("2")
    })

    it("clamps percentComplete at 100 and stillNeeded at 0 when over-funded", () => {
        const r = calculateEmergency({
            monthlyExpenses: D(5000),
            currentSavings: D(50000),
            targetType: "months",
            targetValue: D(6),
            monthlyContribution: D(0),
            annualRatePercent: D(0),
        })
        expect(r.stillNeeded.toString()).toBe("0")
        expect(r.percentComplete.toString()).toBe("100")
        expect(r.timeToGoalMonths?.toString()).toBe("0")
    })

    it("reaches a goal linearly when the rate is zero", () => {
        const r = calculateEmergency({
            monthlyExpenses: D(5000),
            currentSavings: D(0),
            targetType: "amount",
            targetValue: D(12000),
            monthlyContribution: D(500),
            annualRatePercent: D(0),
        })
        expect(r.timeToGoalMonths?.toString()).toBe("24")
        expect(r.principalContributed.toString()).toBe("12000")
        expect(r.interestEarned.toString()).toBe("0")
    })

    it("compounds existing balance + contributions at the rate, faster than the linear case", () => {
        const linearMonths = calculateEmergency({
            monthlyExpenses: D(5000),
            currentSavings: D(10000),
            targetType: "amount",
            targetValue: D(30000),
            monthlyContribution: D(500),
            annualRatePercent: D(0),
        }).timeToGoalMonths!
        const compoundedMonths = calculateEmergency({
            monthlyExpenses: D(5000),
            currentSavings: D(10000),
            targetType: "amount",
            targetValue: D(30000),
            monthlyContribution: D(500),
            annualRatePercent: D(5),
        }).timeToGoalMonths!
        expect(Number(compoundedMonths.toString())).toBeLessThan(
            Number(linearMonths.toString()),
        )
    })

    it("returns null timeToGoalMonths when the goal is unreachable", () => {
        const r = calculateEmergency({
            monthlyExpenses: D(5000),
            currentSavings: D(0),
            targetType: "amount",
            targetValue: D(10000),
            monthlyContribution: D(0),
            annualRatePercent: D(0),
        })
        expect(r.timeToGoalMonths).toBeNull()
    })
})
