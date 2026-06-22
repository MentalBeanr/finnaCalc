import { describe, expect, it } from "vitest"
import { D, Decimal as DecimalCtor } from "@/lib/money/decimal"
import { calculateProfitMargin } from "@/lib/calculations/profit-margin"

const round = (value: DecimalCtor, dp: number) => value.toFixed(dp)

describe("calculateProfitMargin", () => {
    it("computes the three margins for a healthy business", () => {
        const r = calculateProfitMargin({
            revenue: D(100000),
            costOfGoodsSold: D(60000),
            operatingExpenses: D(25000),
            taxRatePercent: D(0),
        })
        // gross = 40k, operating = 15k, net = 15k (no tax)
        expect(r.grossProfit.toString()).toBe("40000")
        expect(r.operatingProfit.toString()).toBe("15000")
        expect(r.netProfit.toString()).toBe("15000")
        expect(r.grossMarginPercent.toString()).toBe("40")
        expect(r.operatingMarginPercent.toString()).toBe("15")
        expect(r.netMarginPercent.toString()).toBe("15")
    })

    it("applies income tax only to positive operating profit", () => {
        const r = calculateProfitMargin({
            revenue: D(100000),
            costOfGoodsSold: D(60000),
            operatingExpenses: D(25000),
            taxRatePercent: D(20),
        })
        // operating = 15k; tax = 3k; net = 12k
        expect(r.taxes.toString()).toBe("3000")
        expect(r.netProfit.toString()).toBe("12000")
        expect(round(r.netMarginPercent, 2)).toBe("12.00")
    })

    it("doesn't tax operating losses", () => {
        const r = calculateProfitMargin({
            revenue: D(100000),
            costOfGoodsSold: D(80000),
            operatingExpenses: D(30000),
            taxRatePercent: D(20),
        })
        // operating = -10k; no tax on losses
        expect(r.operatingProfit.toString()).toBe("-10000")
        expect(r.taxes.toString()).toBe("0")
        expect(r.netProfit.toString()).toBe("-10000")
        expect(round(r.netMarginPercent, 2)).toBe("-10.00")
    })

    it("handles a software-like high-margin business", () => {
        const r = calculateProfitMargin({
            revenue: D(1000000),
            costOfGoodsSold: D(150000),
            operatingExpenses: D(400000),
            taxRatePercent: D(21),
        })
        // gross = 850k (85%), operating = 450k (45%), net = 355.5k (35.55%)
        expect(round(r.grossMarginPercent, 2)).toBe("85.00")
        expect(round(r.operatingMarginPercent, 2)).toBe("45.00")
        expect(round(r.netMarginPercent, 2)).toBe("35.55")
    })
})
