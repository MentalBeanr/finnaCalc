import { describe, it, expect } from "vitest"
import {
    splitNodeId,
    federalReviewDiagnostics,
    buildFederalBreakdown,
} from "@/lib/federal-support-shared"
import { computeFederalReturn } from "@/tax-engine"

const C = (d: number) => d * 100

describe("federal-support-shared helpers", () => {
    describe("splitNodeId", () => {
        it("splits form-line node ids", () => {
            expect(splitNodeId("F1040.L11")).toEqual({ formId: "F1040", lineId: "L11" })
            expect(splitNodeId("Sch1.L20")).toEqual({ formId: "Sch1", lineId: "L20" })
            expect(splitNodeId("WS.provisionalIncome")).toEqual({
                formId: "WS",
                lineId: "provisionalIncome",
            })
        })
        it("handles a dotless id", () => {
            expect(splitNodeId("solo")).toEqual({ formId: "solo", lineId: "_" })
        })
    })

    describe("federalReviewDiagnostics", () => {
        it("flags missing filing status and income", () => {
            const d = federalReviewDiagnostics({ filingStatus: null, incomeCount: 0 })
            expect(d.map((x) => x.code).sort()).toEqual(["FILING_STATUS_REQUIRED", "INCOME_REQUIRED"])
            expect(d.every((x) => x.severity === "error")).toBe(true)
        })
        it("is clean when basics are present", () => {
            expect(federalReviewDiagnostics({ filingStatus: "single", incomeCount: 1 })).toEqual([])
        })
    })

    describe("buildFederalBreakdown", () => {
        it("produces the ordered breakdown from a result", () => {
            const result = computeFederalReturn({
                filingStatus: "single",
                wagesCents: C(80_000),
                withholdingCents: C(9_000),
            })
            const rows = buildFederalBreakdown(result)
            const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.valueCents]))
            expect(byLabel["Total income"]).toBe(C(80_000))
            expect(byLabel["Adjusted gross income"]).toBe(C(80_000))
            expect(byLabel["Standard deduction"]).toBe(C(14_600))
            expect(byLabel["Taxable income"]).toBe(C(65_400))
            expect(byLabel["Total tax"]).toBe(C(9_441))
        })
    })
})
