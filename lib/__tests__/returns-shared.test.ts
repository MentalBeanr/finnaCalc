import { describe, it, expect } from "vitest"
import {
    canTransition,
    canDelete,
    filingStatusLabel,
    isFilingStatus,
    returnStateLabel,
    availableTaxYears,
    formatCents,
} from "@/lib/returns-shared"

describe("returns-shared helpers", () => {
    describe("canTransition", () => {
        it("allows valid forward and back edges", () => {
            expect(canTransition("draft", "ready_to_review")).toBe(true)
            expect(canTransition("ready_to_review", "draft")).toBe(true)
            expect(canTransition("ready_to_review", "ready_to_file")).toBe(true)
        })
        it("rejects illegal jumps", () => {
            expect(canTransition("draft", "submitted")).toBe(false)
            expect(canTransition("accepted", "draft")).toBe(false)
            expect(canTransition("amended", "draft")).toBe(false)
        })
    })

    describe("canDelete", () => {
        it("permits only draft and rejected", () => {
            expect(canDelete("draft")).toBe(true)
            expect(canDelete("rejected")).toBe(true)
            expect(canDelete("submitted")).toBe(false)
            expect(canDelete("accepted")).toBe(false)
        })
    })

    describe("filing status", () => {
        it("labels known statuses and falls back", () => {
            expect(filingStatusLabel("mfj")).toBe("Married filing jointly")
            expect(filingStatusLabel(null)).toBe("Not set")
        })
        it("validates membership", () => {
            expect(isFilingStatus("hoh")).toBe(true)
            expect(isFilingStatus("nope")).toBe(false)
        })
    })

    it("labels return states", () => {
        expect(returnStateLabel("ready_to_file")).toBe("Ready to file")
        expect(returnStateLabel("unknown")).toBe("unknown")
    })

    it("lists recent tax years newest first", () => {
        expect(availableTaxYears(2025)).toEqual([2025, 2024, 2023])
        expect(availableTaxYears(2025, 2)).toEqual([2025, 2024])
    })

    it("formats integer cents as whole-dollar USD", () => {
        expect(formatCents(1234500)).toBe("$12,345")
        expect(formatCents(0)).toBe("$0")
    })
})
