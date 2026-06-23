import { describe, it, expect } from "vitest"
import {
    parseDollarsToCents,
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

    describe("income types", () => {
        it("validates and labels interview income types", () => {
            expect(isInterviewIncomeType("w2")).toBe(true)
            expect(isInterviewIncomeType("sch_c")).toBe(false)
            expect(incomeTypeLabel("1099_int")).toBe("Interest income (1099-INT)")
        })
    })

    describe("mapToFederalInput", () => {
        it("returns null until filing status is set", () => {
            expect(mapToFederalInput({ filingStatus: null, income: [], numChildren: 0 })).toBeNull()
        })
        it("aggregates income by type into the federal input", () => {
            const input = mapToFederalInput({
                filingStatus: "single",
                income: [
                    { type: "w2", amountCents: 5_000_000, withholdingCents: 600_000 },
                    { type: "w2", amountCents: 3_000_000, withholdingCents: 300_000 },
                    { type: "1099_int", amountCents: 100_000, withholdingCents: 0 },
                    { type: "ss", amountCents: 2_000_000, withholdingCents: 0 },
                ],
                numChildren: 2,
            })
            expect(input).toEqual({
                filingStatus: "single",
                wagesCents: 8_000_000,
                interestCents: 100_000,
                socialSecurityCents: 2_000_000,
                withholdingCents: 900_000,
                numChildren: 2,
            })
        })
    })
})
