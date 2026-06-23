import { describe, it, expect } from "vitest"
import {
    validateSignatureInput,
    rejectMessage,
    filingStateLabel,
    CONSENT_ITEMS,
} from "@/lib/filing-shared"
import { StubTransmitter } from "@/lib/server/filing"

describe("filing-shared helpers", () => {
    describe("validateSignatureInput", () => {
        it("accepts a whole-dollar prior-year AGI", () => {
            expect(validateSignatureInput({ priorYearAgi: "80000" })).toEqual({ ok: true })
            expect(validateSignatureInput({ priorYearAgi: "$1,200" })).toEqual({ ok: true })
        })
        it("rejects a missing or non-numeric AGI", () => {
            expect(validateSignatureInput({ priorYearAgi: "" }).ok).toBe(false)
            expect(validateSignatureInput({ priorYearAgi: "abc" }).ok).toBe(false)
        })
        it("rejects a malformed IP PIN", () => {
            expect(validateSignatureInput({ priorYearAgi: "100", ipPin: "12" }).ok).toBe(false)
            expect(validateSignatureInput({ priorYearAgi: "100", ipPin: "123456" }).ok).toBe(true)
        })
    })

    describe("rejectMessage", () => {
        it("maps known codes and falls back", () => {
            expect(rejectMessage("IND-031-04")).toMatch(/prior-year AGI/)
            expect(rejectMessage("XYZ-999")).toMatch(/XYZ-999/)
        })
    })

    it("labels filing states", () => {
        expect(filingStateLabel("accepted")).toBe("Accepted")
        expect(filingStateLabel("imperfect")).toBe("Accepted (imperfect)")
    })

    it("defines the required consents", () => {
        expect(CONSENT_ITEMS.map((c) => c.type)).toEqual([
            "7216_use",
            "7216_disclosure",
            "esign_disclosure",
        ])
    })
})

describe("StubTransmitter", () => {
    it("accepts deterministically", async () => {
        const result = await new StubTransmitter().transmit({ returnId: "r1", payload: {} })
        expect(result.status).toBe("accepted")
        expect(result.submissionId).toBe("stub_r1")
    })
})
