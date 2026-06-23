import { describe, it, expect } from "vitest"
import { priceReturn, FEDERAL_FILING_FEE_CENTS } from "@/lib/pricing-shared"
import { StubPaymentProcessor } from "@/lib/server/payments"

describe("priceReturn", () => {
    it("prices a federal-only return as free", () => {
        const pricing = priceReturn({})
        expect(pricing.totalCents).toBe(0)
        expect(pricing.items).toEqual([{ label: "Federal filing", amountCents: FEDERAL_FILING_FEE_CENTS }])
    })

    it("adds a state line item when state filings are present", () => {
        const pricing = priceReturn({ stateFilings: 2 })
        expect(pricing.items).toHaveLength(2)
        expect(pricing.items[1].label).toBe("State filing × 2")
        // State filing is $0 until delivered (roadmap #11).
        expect(pricing.totalCents).toBe(0)
    })
})

describe("StubPaymentProcessor", () => {
    it("captures deterministically with a referenceable id", async () => {
        const proc = new StubPaymentProcessor()
        const res = await proc.charge({
            amountCents: 1495,
            idempotencyKey: "ret-1:filing_fee",
            description: "test",
        })
        expect(res.status).toBe("captured")
        expect(res.ref).toBe("stub_ret-1:filing_fee")
    })
})
