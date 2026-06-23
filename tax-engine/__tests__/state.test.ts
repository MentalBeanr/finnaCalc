import { describe, it, expect } from "vitest"
import { computeStateReturn, isSupportedState, SUPPORTED_STATE_CODES } from "@/tax-engine"

const C = (d: number) => d * 100

describe("state tax support", () => {
    it("lists supported states", () => {
        expect(SUPPORTED_STATE_CODES).toContain("CO")
        expect(SUPPORTED_STATE_CODES).toContain("IL")
    })

    it("Colorado is 4.4% of federal taxable income", () => {
        const r = computeStateReturn({
            stateCode: "CO",
            agiCents: C(80_000),
            taxableIncomeCents: C(65_400),
        })
        expect(r?.stateName).toBe("Colorado")
        // 65,400 × 4.4% = 2,877.60
        expect(r?.stateTaxCents).toBe(287_760)
        expect(r?.converged).toBe(true)
    })

    it("Illinois is 4.95% of federal AGI", () => {
        const r = computeStateReturn({
            stateCode: "IL",
            agiCents: C(80_000),
            taxableIncomeCents: C(65_400),
        })
        // 80,000 × 4.95% = 3,960
        expect(r?.stateTaxCents).toBe(C(3_960))
    })

    it("returns null for an unsupported state", () => {
        expect(computeStateReturn({ stateCode: "TX", agiCents: 0, taxableIncomeCents: 0 })).toBeNull()
        expect(isSupportedState("TX")).toBe(false)
        expect(isSupportedState("CO")).toBe(true)
    })
})
