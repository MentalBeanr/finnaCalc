import { describe, expect, it } from "vitest"
import { D, Decimal as DecimalCtor } from "@/lib/money/decimal"
import { calculateRoi } from "@/lib/calculations/roi"

const round = (value: DecimalCtor, dp: number) => value.toFixed(dp)

describe("calculateRoi", () => {
    it("computes simple ROI with no dividends, taxes, or inflation", () => {
        const result = calculateRoi({
            initialInvestment: D(10000),
            finalValue: D(15000),
            timeYears: D(2),
            method: "simple",
            dividendYieldPercent: D(0),
            inflationPercent: D(0),
            taxRatePercent: D(0),
        })
        expect(result.totalReturn.toString()).toBe("5000")
        expect(round(result.totalRoiPercent, 2)).toBe("50.00")
        expect(round(result.annualizedRoiPercent, 2)).toBe("25.00")
        expect(result.totalTax.toString()).toBe("0")
        expect(result.afterTaxReturn.toString()).toBe("5000")
    })

    it("computes the CAGR for an annualized 10-year doubling", () => {
        const result = calculateRoi({
            initialInvestment: D(10000),
            finalValue: D(20000),
            timeYears: D(10),
            method: "annualized",
            dividendYieldPercent: D(0),
            inflationPercent: D(0),
            taxRatePercent: D(0),
        })
        // 2^(1/10) - 1 ≈ 0.0717734625... → 7.18%
        expect(round(result.annualizedRoiPercent, 2)).toBe("7.18")
    })

    it("subtracts capital gains tax on positive returns but not on losses", () => {
        const gain = calculateRoi({
            initialInvestment: D(10000),
            finalValue: D(15000),
            timeYears: D(2),
            method: "simple",
            dividendYieldPercent: D(0),
            inflationPercent: D(0),
            taxRatePercent: D(20),
        })
        // 5000 * 0.20 = 1000 tax; after-tax = 5000 - 1000 = 4000
        expect(gain.capitalGainsTax.toString()).toBe("1000")
        expect(gain.afterTaxReturn.toString()).toBe("4000")

        const loss = calculateRoi({
            initialInvestment: D(10000),
            finalValue: D(8000),
            timeYears: D(2),
            method: "simple",
            dividendYieldPercent: D(0),
            inflationPercent: D(0),
            taxRatePercent: D(20),
        })
        // No tax on a loss; after-tax = -2000
        expect(loss.capitalGainsTax.toString()).toBe("0")
        expect(loss.afterTaxReturn.toString()).toBe("-2000")
    })

    it("adds dividend income and taxes it at the same rate", () => {
        const result = calculateRoi({
            initialInvestment: D(10000),
            finalValue: D(10000),
            timeYears: D(5),
            method: "simple",
            dividendYieldPercent: D(4),
            inflationPercent: D(0),
            taxRatePercent: D(25),
        })
        // 4% of 10000 = 400/year × 5 = 2000 dividend income
        // dividend tax = 2000 * 0.25 = 500
        // capital gains = 0 (flat); cap gains tax = 0
        // after-tax = 0 + 2000 - 500 = 1500
        expect(result.totalDividendIncome.toString()).toBe("2000")
        expect(result.incomeTax.toString()).toBe("500")
        expect(result.totalTax.toString()).toBe("500")
        expect(result.afterTaxReturn.toString()).toBe("1500")
    })

    it("computes the Fisher real return given nominal and inflation", () => {
        const result = calculateRoi({
            initialInvestment: D(10000),
            finalValue: D(16289), // ≈ 5%/yr CAGR over 10y → 10000 * 1.05^10
            timeYears: D(10),
            method: "annualized",
            dividendYieldPercent: D(0),
            inflationPercent: D(3),
            taxRatePercent: D(0),
        })
        // nominal ≈ 5%, inflation = 3% → real ≈ (1.05/1.03) - 1 ≈ 1.94%
        expect(Number(round(result.annualizedRoiPercent, 2))).toBeCloseTo(5, 1)
        expect(Number(round(result.realAnnualizedRoiPercent, 2))).toBeCloseTo(1.94, 1)
    })
})
