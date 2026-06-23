import { describe, it, expect } from "vitest"
import { normalizeSuggestions } from "@/lib/extraction-shared"

describe("normalizeSuggestions", () => {
    it("maps recognized types and parses amounts to cents", () => {
        const out = normalizeSuggestions([
            { type: "W-2", amount: 80000, withholding: 9000 },
            { type: "1099-INT", amount: "1,200" },
            { type: "Social Security", amount: "20000" },
        ])
        expect(out).toEqual([
            { type: "w2", label: "W-2 wages", amountCents: 8_000_000, withholdingCents: 900_000 },
            {
                type: "1099_int",
                label: "Interest income (1099-INT)",
                amountCents: 120_000,
                withholdingCents: 0,
            },
            {
                type: "ss",
                label: "Social Security benefits",
                amountCents: 2_000_000,
                withholdingCents: 0,
            },
        ])
    })

    it("drops unusable suggestions", () => {
        const out = normalizeSuggestions([
            { type: "Schedule C", amount: 5000 }, // unsupported type
            { type: "W-2", amount: 0 }, // non-positive
            { type: "W-2" }, // no amount
            { amount: 100 }, // no type
        ])
        expect(out).toEqual([])
    })
})
