import { describe, expect, it } from "vitest"
import { D } from "@/lib/money/decimal"
import {
    buildAmortizationSchedule,
    calculateApr,
    calculateMaxLoanAmount,
    calculatePayment,
    calculateRemainingBalance,
} from "@/lib/calculations/loan"

import { Decimal as DecimalCtor } from "@/lib/money/decimal"

const round = (value: DecimalCtor, dp: number) => value.toFixed(dp)

describe("calculatePayment", () => {
    it("computes the textbook 30-year mortgage payment", () => {
        const result = calculatePayment({
            loanAmount: D(200000),
            interestRate: D(6),
            termMonths: D(360),
            downPayment: D(0),
            frequency: "monthly",
        })
        expect(round(result.paymentPerPeriod, 2)).toBe("1199.10")
        expect(result.periods.toString()).toBe("360")
        expect(round(result.totalPayment, 2)).toBe("431676.38")
        expect(round(result.totalInterest, 2)).toBe("231676.38")
        expect(result.principal.toString()).toBe("200000")
    })

    it("computes the textbook 5-year auto loan payment", () => {
        const result = calculatePayment({
            loanAmount: D(30000),
            interestRate: D(5),
            termMonths: D(60),
            downPayment: D(0),
            frequency: "monthly",
        })
        expect(round(result.paymentPerPeriod, 2)).toBe("566.14")
    })

    it("subtracts the down payment from principal", () => {
        const result = calculatePayment({
            loanAmount: D(30000),
            interestRate: D(5),
            termMonths: D(60),
            downPayment: D(5000),
            frequency: "monthly",
        })
        expect(result.principal.toString()).toBe("25000")
        expect(round(result.paymentPerPeriod, 2)).toBe("471.78")
    })

    it("handles the zero-interest edge case as a straight-line amortization", () => {
        const result = calculatePayment({
            loanAmount: D(12000),
            interestRate: D(0),
            termMonths: D(24),
            downPayment: D(0),
            frequency: "monthly",
        })
        expect(result.paymentPerPeriod.toString()).toBe("500")
        expect(result.totalInterest.toString()).toBe("0")
    })

    it("scales periods correctly for biweekly frequency", () => {
        const result = calculatePayment({
            loanAmount: D(24000),
            interestRate: D(0),
            termMonths: D(12),
            downPayment: D(0),
            frequency: "biweekly",
        })
        expect(result.periods.toString()).toBe("26")
        expect(round(result.paymentPerPeriod, 2)).toBe("923.08")
    })

    it("is deterministic — same inputs always yield same outputs", () => {
        const inputs = {
            loanAmount: D(150000),
            interestRate: D(4.25),
            termMonths: D(180),
            downPayment: D(15000),
            frequency: "monthly" as const,
        }
        const a = calculatePayment(inputs)
        const b = calculatePayment(inputs)
        expect(a.paymentPerPeriod.toString()).toBe(b.paymentPerPeriod.toString())
        expect(a.totalInterest.toString()).toBe(b.totalInterest.toString())
    })
})

describe("calculateApr", () => {
    it("uses the simple-interest APR approximation", () => {
        const result = calculateApr({
            loanAmount: D(10000),
            totalInterest: D(2500),
            fees: D(500),
            termYears: D(5),
        })
        expect(round(result.apr, 4)).toBe("6.0000")
        expect(result.totalCost.toString()).toBe("3000")
    })

    it("handles zero fees", () => {
        const result = calculateApr({
            loanAmount: D(20000),
            totalInterest: D(4000),
            fees: D(0),
            termYears: D(4),
        })
        expect(round(result.apr, 2)).toBe("5.00")
    })
})

describe("calculateMaxLoanAmount", () => {
    it("inverts the PMT formula correctly", () => {
        const payment = calculatePayment({
            loanAmount: D(50000),
            interestRate: D(6),
            termMonths: D(60),
            downPayment: D(0),
            frequency: "monthly",
        })
        const inverse = calculateMaxLoanAmount({
            monthlyPayment: payment.paymentPerPeriod,
            interestRate: D(6),
            termMonths: D(60),
        })
        expect(round(inverse.maxLoanAmount, 2)).toBe("50000.00")
    })

    it("handles the zero-interest edge case", () => {
        const result = calculateMaxLoanAmount({
            monthlyPayment: D(500),
            interestRate: D(0),
            termMonths: D(24),
        })
        expect(result.maxLoanAmount.toString()).toBe("12000")
    })
})

describe("calculateRemainingBalance", () => {
    it("computes the original principal when zero payments have been made", () => {
        const result = calculateRemainingBalance({
            originalAmount: D(200000),
            interestRate: D(6),
            termMonths: D(360),
            paymentsMade: D(0),
        })
        expect(round(result.remainingBalance, 2)).toBe("200000.00")
        expect(result.totalPaid.toString()).toBe("0")
        expect(result.remainingPayments.toString()).toBe("360")
    })

    it("returns zero when all payments have been made (clamped, not negative)", () => {
        const result = calculateRemainingBalance({
            originalAmount: D(200000),
            interestRate: D(6),
            termMonths: D(360),
            paymentsMade: D(360),
        })
        expect(result.remainingBalance.toString()).toBe("0")
        expect(result.remainingPayments.toString()).toBe("0")
    })

    it("computes a sensible midpoint balance", () => {
        const result = calculateRemainingBalance({
            originalAmount: D(200000),
            interestRate: D(6),
            termMonths: D(360),
            paymentsMade: D(180),
        })
        expect(Number(result.remainingBalance.toFixed(0))).toBeGreaterThan(140000)
        expect(Number(result.remainingBalance.toFixed(0))).toBeLessThan(150000)
        expect(round(result.monthlyPayment, 2)).toBe("1199.10")
    })

    it("handles the zero-interest edge case linearly", () => {
        const result = calculateRemainingBalance({
            originalAmount: D(12000),
            interestRate: D(0),
            termMonths: D(24),
            paymentsMade: D(12),
        })
        expect(result.monthlyPayment.toString()).toBe("500")
        expect(result.remainingBalance.toString()).toBe("6000")
        expect(result.totalPaid.toString()).toBe("6000")
    })
})

describe("buildAmortizationSchedule", () => {
    it("produces one row per period and closes the balance to zero on the textbook mortgage", () => {
        const schedule = buildAmortizationSchedule({
            loanAmount: D(200000),
            interestRate: D(6),
            termMonths: D(360),
            downPayment: D(0),
            frequency: "monthly",
        })
        expect(schedule.length).toBe(360)
        expect(schedule[359].balance.toString()).toBe("0")
        // Period 1: interest = 200000 * 0.005 = 1000.00; principal = 1199.10 - 1000.00 ≈ 199.10
        expect(round(schedule[0].interest, 2)).toBe("1000.00")
        expect(round(schedule[0].principal, 2)).toBe("199.10")
        // Cumulative interest at the end matches the total interest on the loan
        expect(round(schedule[359].cumulativeInterest, 0)).toBe("231676")
    })

    it("amortizes a zero-interest loan as straight-line", () => {
        const schedule = buildAmortizationSchedule({
            loanAmount: D(12000),
            interestRate: D(0),
            termMonths: D(24),
            downPayment: D(0),
            frequency: "monthly",
        })
        expect(schedule.length).toBe(24)
        expect(schedule.every((p) => p.interest.toString() === "0")).toBe(true)
        expect(schedule.every((p) => round(p.principal, 2) === "500.00")).toBe(true)
        expect(schedule[23].balance.toString()).toBe("0")
    })

    it("monotonically decreases balance and increases cumulative principal", () => {
        const schedule = buildAmortizationSchedule({
            loanAmount: D(30000),
            interestRate: D(5),
            termMonths: D(60),
            downPayment: D(0),
            frequency: "monthly",
        })
        for (let i = 1; i < schedule.length; i++) {
            expect(schedule[i].balance.lte(schedule[i - 1].balance)).toBe(true)
            expect(schedule[i].cumulativePrincipal.gte(schedule[i - 1].cumulativePrincipal)).toBe(true)
        }
    })
})
