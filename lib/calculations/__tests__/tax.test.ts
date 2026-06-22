import { describe, expect, it } from "vitest"
import { D, Decimal as DecimalCtor } from "@/lib/money/decimal"
import {
    applyBrackets,
    BRACKETS_2024,
    calculateBusinessTax,
    calculateIndividualTax,
} from "@/lib/calculations/tax"

const round = (value: DecimalCtor, dp: number) => value.toFixed(dp)

describe("applyBrackets", () => {
    it("returns zero tax and zero marginal rate at zero income", () => {
        const r = applyBrackets(D(0), BRACKETS_2024.single)
        expect(r.tax.toString()).toBe("0")
        expect(r.marginalRatePercent.toString()).toBe("0")
    })

    it("computes textbook 2024 single tax at $50,000 taxable income", () => {
        // Single brackets: 10% to 11600, 12% to 47150, 22% above
        // 11600 * .10 + (47150-11600) * .12 + (50000-47150) * .22
        // = 1160 + 4266 + 627 = 6053
        const r = applyBrackets(D(50000), BRACKETS_2024.single)
        expect(round(r.tax, 2)).toBe("6053.00")
        expect(r.marginalRatePercent.toString()).toBe("22")
    })

    it("computes married-filing-jointly tax at $100,000 taxable income", () => {
        // 23200 * .10 + (94300-23200) * .12 + (100000-94300) * .22
        // = 2320 + 8532 + 1254 = 12106
        const r = applyBrackets(D(100000), BRACKETS_2024.married)
        expect(round(r.tax, 2)).toBe("12106.00")
        expect(r.marginalRatePercent.toString()).toBe("22")
    })
})

describe("calculateIndividualTax", () => {
    it("uses the standard deduction when itemized < standard", () => {
        const r = calculateIndividualTax({
            filingStatus: "single",
            grossIncome: D(75000),
            dependents: D(0),
            mortgageInterest: D(0),
            charitableDonations: D(0),
            stateLocalTax: D(0),
            medicalExpenses: D(0),
            studentLoanInterest: D(0),
            childTaxCredit: false,
            earnedIncomeCredit: false,
        })
        expect(r.usingStandardDeduction).toBe(true)
        expect(r.totalDeductions.toString()).toBe("14600")
        // taxable = 75000 - 14600 = 60400
        expect(r.taxableIncome.toString()).toBe("60400")
        // 1160 + (47150-11600)*.12 + (60400-47150)*.22 = 1160 + 4266 + 2915 = 8341
        expect(round(r.finalTax, 2)).toBe("8341.00")
    })

    it("switches to itemized when itemized > standard, with SALT cap applied", () => {
        const r = calculateIndividualTax({
            filingStatus: "single",
            grossIncome: D(120000),
            dependents: D(0),
            mortgageInterest: D(12000),
            charitableDonations: D(3000),
            stateLocalTax: D(15000), // capped to 10000
            medicalExpenses: D(0),
            studentLoanInterest: D(0),
            childTaxCredit: false,
            earnedIncomeCredit: false,
        })
        // itemized = 12000 + 3000 + 10000 (capped) + 0 = 25000 > 14600
        expect(r.usingStandardDeduction).toBe(false)
        expect(r.itemizedDeductions.toString()).toBe("25000")
        expect(r.totalDeductions.toString()).toBe("25000")
    })

    it("subtracts the child tax credit per dependent", () => {
        const without = calculateIndividualTax({
            filingStatus: "married",
            grossIncome: D(120000),
            dependents: D(2),
            mortgageInterest: D(0),
            charitableDonations: D(0),
            stateLocalTax: D(0),
            medicalExpenses: D(0),
            studentLoanInterest: D(0),
            childTaxCredit: false,
            earnedIncomeCredit: false,
        })
        const withCredit = calculateIndividualTax({
            filingStatus: "married",
            grossIncome: D(120000),
            dependents: D(2),
            mortgageInterest: D(0),
            charitableDonations: D(0),
            stateLocalTax: D(0),
            medicalExpenses: D(0),
            studentLoanInterest: D(0),
            childTaxCredit: true,
            earnedIncomeCredit: false,
        })
        // 2 dependents * $2000 = $4000 credit
        const diff = without.finalTax.minus(withCredit.finalTax)
        expect(diff.toString()).toBe("4000")
    })

    it("computes positive tax savings when itemizing", () => {
        const r = calculateIndividualTax({
            filingStatus: "single",
            grossIncome: D(150000),
            dependents: D(0),
            mortgageInterest: D(20000),
            charitableDonations: D(5000),
            stateLocalTax: D(10000),
            medicalExpenses: D(0),
            studentLoanInterest: D(0),
            childTaxCredit: false,
            earnedIncomeCredit: false,
        })
        expect(Number(r.taxSavings.toFixed(2))).toBeGreaterThan(0)
    })
})

describe("calculateBusinessTax", () => {
    it("computes SE tax on 92.35% of net business income at 15.3%", () => {
        const r = calculateBusinessTax({
            businessIncome: D(100000),
            businessExpenses: D(20000),
            homeOffice: D(0),
            vehicleExpenses: D(0),
            equipment: D(0),
        })
        // net = 80000; SE base = 80000 * 0.9235 = 73880; SE tax = 73880 * 0.153 = 11303.64
        expect(r.netBusinessIncome.toString()).toBe("80000")
        expect(round(r.selfEmploymentTax, 2)).toBe("11303.64")
        // 50% deductible from AGI
        expect(round(r.deductibleSETax, 2)).toBe("5651.82")
    })

    it("totals federal income tax plus SE tax", () => {
        const r = calculateBusinessTax({
            businessIncome: D(80000),
            businessExpenses: D(10000),
            homeOffice: D(0),
            vehicleExpenses: D(0),
            equipment: D(0),
        })
        expect(round(r.totalTax, 2)).toBe(
            round(r.federalTax.plus(r.selfEmploymentTax), 2),
        )
    })

    it("reports positive tax savings against the no-deductions baseline", () => {
        const r = calculateBusinessTax({
            businessIncome: D(150000),
            businessExpenses: D(25000),
            homeOffice: D(5000),
            vehicleExpenses: D(8000),
            equipment: D(12000),
        })
        expect(Number(r.taxSavings.toFixed(2))).toBeGreaterThan(0)
    })
})
