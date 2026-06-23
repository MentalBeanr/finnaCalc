import { describe, it, expect } from "vitest"
import { computeFederalReturn } from "@/tax-engine/federal"

const C = (d: number) => d * 100

describe("federal TY2024 — golden fixtures", () => {
    it("single, $80k wages, $9k withheld → owes $441", () => {
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(80_000),
            withholdingCents: C(9_000),
        })
        expect(r.converged).toBe(true)
        expect(r.agiCents).toBe(C(80_000))
        expect(r.deductionCents).toBe(C(14_600))
        expect(r.taxableIncomeCents).toBe(C(65_400))
        expect(r.taxBeforeCreditsCents).toBe(C(9_441))
        expect(r.creditsCents).toBe(0)
        expect(r.taxAfterCreditsCents).toBe(C(9_441))
        expect(r.refundOrDueCents).toBe(-C(441))
        expect(r.marginalRateBp).toBe(2200)
    })

    it("MFJ, $120k wages, 2 children, $12k withheld → refund $5,568", () => {
        const r = computeFederalReturn({
            filingStatus: "mfj",
            wagesCents: C(120_000),
            numChildren: 2,
            withholdingCents: C(12_000),
        })
        expect(r.agiCents).toBe(C(120_000))
        expect(r.deductionCents).toBe(C(29_200))
        expect(r.taxableIncomeCents).toBe(C(90_800))
        expect(r.taxBeforeCreditsCents).toBe(C(10_432))
        expect(r.creditsCents).toBe(C(4_000))
        expect(r.taxAfterCreditsCents).toBe(C(6_432))
        expect(r.refundOrDueCents).toBe(C(5_568))
        expect(r.marginalRateBp).toBe(1200)
    })

    it("single, $20k wages + $20k Social Security → $2,500 of SS is taxable", () => {
        const r = computeFederalReturn({
            filingStatus: "single",
            wagesCents: C(20_000),
            socialSecurityCents: C(20_000),
        })
        expect(r.taxableSocialSecurityCents).toBe(C(2_500))
        expect(r.agiCents).toBe(C(22_500))
        expect(r.taxableIncomeCents).toBe(C(7_900))
        expect(r.taxBeforeCreditsCents).toBe(C(790))
        expect(r.refundOrDueCents).toBe(-C(790))
    })

    it("exposes form-line values and a non-empty trace", () => {
        const r = computeFederalReturn({ filingStatus: "single", wagesCents: C(50_000) })
        expect(r.formLineValues["F1040.L16"]).toBe(r.taxBeforeCreditsCents)
        expect(r.formLineValues["F1040.L11"]).toBe(r.agiCents)
        expect(r.trace.length).toBeGreaterThan(0)
        // Acyclic ruleset converges quickly.
        expect(r.iterations).toBeLessThanOrEqual(3)
    })
})
