import { describe, it, expect } from "vitest"
import {
    sanitizeFilename,
    validateUpload,
    documentDisplayName,
    isUploadableKind,
    MAX_UPLOAD_BYTES,
} from "@/lib/documents-shared"

describe("document helpers", () => {
    describe("sanitizeFilename", () => {
        it("replaces unsafe characters with underscores", () => {
            expect(sanitizeFilename("My W-2 (2024)!.pdf")).toBe("My_W-2_2024_.pdf")
        })
        it("collapses runs of underscores and bounds length", () => {
            expect(sanitizeFilename("a   b")).toBe("a_b")
            expect(sanitizeFilename("x".repeat(200)).length).toBe(120)
        })
        it("falls back to 'file' for an all-unsafe name", () => {
            expect(sanitizeFilename("/// ")).toBe("file")
        })
    })

    describe("validateUpload", () => {
        it("accepts a normal PDF", () => {
            expect(validateUpload({ size: 1000, type: "application/pdf" })).toEqual({ ok: true })
        })
        it("rejects empty files", () => {
            expect(validateUpload({ size: 0, type: "application/pdf" }).ok).toBe(false)
        })
        it("rejects oversize files", () => {
            expect(validateUpload({ size: MAX_UPLOAD_BYTES + 1, type: "image/png" }).ok).toBe(false)
        })
        it("rejects disallowed types", () => {
            expect(validateUpload({ size: 100, type: "application/zip" }).ok).toBe(false)
        })
    })

    describe("documentDisplayName", () => {
        it("returns the final path segment", () => {
            expect(documentDisplayName("user-1/doc-2/My_W2.pdf")).toBe("My_W2.pdf")
        })
    })

    describe("isUploadableKind", () => {
        it("accepts known kinds and rejects others", () => {
            expect(isUploadableKind("w2")).toBe(true)
            expect(isUploadableKind("1099")).toBe(true)
            expect(isUploadableKind("mef_payload")).toBe(false)
            expect(isUploadableKind("nope")).toBe(false)
        })
    })
})
