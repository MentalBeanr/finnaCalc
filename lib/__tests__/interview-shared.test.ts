import { describe, it, expect } from "vitest"
import {
    parseDollarsToCents,
    parseSignedDollarsToCents,
    isInterviewIncomeType,
    incomeTypeLabel,
    mapToFederalInput,
} from "@/lib/interview-shared"

describe("interview-shared helpers", () => {
    describe("parseDollarsToCents", () => {
        it("parses plain and formatted dollars to cents", () => {
            expect(parseDollarsToCents("80000")).toBe(8_000_000)
            expect(parseDollarsToCents("$1,234.56")).toBe(123_456)
            expect(parseDollarsToCents("0")).toBe(0)
        })
        it("rejects invalid or negative input", () => {
            expect(parseDollarsToCents("")).toBeNull()
            expect(parseDollarsToCents("abc")).toBeNull()
            expect(parseDollarsToCents("-5")).toBeNull()
        })
    })

    describe("parseSignedDollarsToCents", () => {
        it("parses positive and negative values", () => {
            expect(parseSignedDollarsToCents("1500")).toBe(150_000)
            expect(parseSignedDollarsToCents("-2500")).toBe(-250_000)
            expect(parseSignedDollarsToCents("0")).toBe(0)
        })
        it("rejects non-numeric input", () => {
            expect(parseSignedDollarsToCents("")).toBeNull()
            expect(parseSignedDollarsToCents("abc")).toBeNull()
        })
    })

    describe("income types", () => {
        it("validates and labels interview income types", () => {
            expect(isInterviewIncomeType("w2")).toBe(true)
            expect(isInterviewIncomeType("1099_nec")).toBe(true)
            expect(isInterviewIncomeType("1099_div")).toBe(true)
            expect(isInterviewIncomeType("1099_b")).toBe(true)
            expect(isInterviewIncomeType("sch_c")).toBe(false)
            expect(incomeTypeLabel("1099_int")).toBe("Interest income (1099-INT)")
            expect(incomeTypeLabel("1099_nec")).toBe("Self-employment / freelance (1099-NEC)")
        })
    })

    describe("mapToFederalInput", () => {
        it("returns null until filing status is set", () => {
            expect(
                mapToFederalInput({ filingStatus: null, income: [], numChildren: 0, deductions: [] }),
            ).toBeNull()
        })

        it("aggregates income by type into the federal input", () => {
            const input = mapToFederalInput({
                filingStatus: "single",
                income: [
                    { type: "w2", amountCents: 5_000_000, withholdingCents: 600_000, metadata: {} },
                    { type: "w2", amountCents: 3_000_000, withholdingCents: 300_000, metadata: {} },
                    { type: "1099_int", amountCents: 100_000, withholdingCents: 0, metadata: {} },
                    { type: "ss", amountCents: 2_000_000, withholdingCents: 0, metadata: {} },
                ],
                numChildren: 2,
                deductions: [],
            })
            expect(input).toEqual({
                filingStatus: "single",
                wagesCents: 8_000_000,
                interestCents: 100_000,
                socialSecurityCents: 2_000_000,
                withholdingCents: 900_000,
                numChildren: 2,
                schedCNetProfitCents: 0,
                shortTermGainCents: 0,
                longTermGainCents: 0,
                ordinaryDividendsCents: 0,
                qualifiedDividendsCents: 0,
                mortgageInterestCents: 0,
                saltPaidCents: 0,
                charitableContributionsCents: 0,
                medicalExpensesCents: 0,
            })
        })

        it("maps 1099-NEC to schedCNetProfitCents", () => {
            const input = mapToFederalInput({
                filingStatus: "single",
                income: [
                    { type: "1099_nec", amountCents: 4_000_000, withholdingCents: 0, metadata: {} },
                ],
                numChildren: 0,
                deductions: [],
            })
            expect(input?.schedCNetProfitCents).toBe(4_000_000)
        })

        it("maps 1099-DIV with qualified amount from metadata", () => {
            const input = mapToFederalInput({
                filingStatus: "single",
                income: [
                    {
                        type: "1099_div",
                        amountCents: 500_000,
                        withholdingCents: 0,
                        metadata: { qualifiedCents: 300_000 },
                    },
                ],
                numChildren: 0,
                deductions: [],
            })
            expect(input?.ordinaryDividendsCents).toBe(500_000)
            expect(input?.qualifiedDividendsCents).toBe(300_000)
        })

        it("routes 1099-B by term from metadata (default long-term)", () => {
            const input = mapToFederalInput({
                filingStatus: "single",
                income: [
                    { type: "1099_b", amountCents: 200_000, withholdingCents: 0, metadata: { term: "short" } },
                    { type: "1099_b", amountCents: -50_000, withholdingCents: 0, metadata: { term: "long" } },
                ],
                numChildren: 0,
                deductions: [],
            })
            expect(input?.shortTermGainCents).toBe(200_000)
            expect(input?.longTermGainCents).toBe(-50_000)
        })

        it("aggregates itemized deductions by type", () => {
            const input = mapToFederalInput({
                filingStatus: "single",
                income: [],
                numChildren: 0,
                deductions: [
                    { type: "mortgage_interest", amountCents: 1_200_000 },
                    { type: "salt", amountCents: 800_000 },
                    { type: "charitable", amountCents: 300_000 },
                ],
            })
            expect(input?.mortgageInterestCents).toBe(1_200_000)
            expect(input?.saltPaidCents).toBe(800_000)
            expect(input?.charitableContributionsCents).toBe(300_000)
        })
    })
})
