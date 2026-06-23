import { describe, it, expect } from "vitest"
import * as schema from "@/db/schema"
import { getDb } from "@/db/client"

describe("tax-platform db foundation", () => {
    it("exposes the foundational tables", () => {
        const expected = [
            "users",
            "taxReturns",
            "returnPeople",
            "incomeSources",
            "deductionsClaimed",
            "creditsClaimed",
            "documents",
            "taxCalculations",
            "formLineValues",
            "filings",
            "filingEvents",
            "auditLogs",
        ] as const
        for (const name of expected) {
            expect(schema[name], `schema.${name} should be defined`).toBeDefined()
        }
    })

    it("does not connect at import time and throws clearly without DATABASE_URL", () => {
        const prev = process.env.DATABASE_URL
        delete process.env.DATABASE_URL
        try {
            expect(() => getDb()).toThrow(/DATABASE_URL/)
        } finally {
            if (prev !== undefined) process.env.DATABASE_URL = prev
        }
    })
})
