import { describe, expect, it } from "vitest"
import {
    categorizeTransaction,
    cleanDescription,
    detectFileKind,
    parseCsvRows,
    parsePdfText,
    parseTxtText,
} from "@/lib/calculations/budget-import"

describe("cleanDescription", () => {
    it("strips long alphanumeric ids and dates and title-cases", () => {
        const out = cleanDescription(
            "POS DEBIT 03/14/2024 STARBUCKS #1234 ABCDEFGH123456",
        )
        expect(out).toMatch(/Starbucks/i)
        expect(out).not.toMatch(/ABCDEFGH123456/)
        expect(out).not.toMatch(/03\/14\/2024/)
    })

    it("returns Unknown Transaction for empty input", () => {
        expect(cleanDescription("")).toBe("Unknown Transaction")
    })

    it("title cases the result", () => {
        expect(cleanDescription("netflix subscription")).toBe(
            "Netflix Subscription",
        )
    })
})

describe("categorizeTransaction", () => {
    it("maps salary keywords to Salary for personal", () => {
        expect(categorizeTransaction("Direct Deposit Payroll", "personal", true)).toBe(
            "Salary",
        )
    })

    it("maps Netflix to Entertainment for personal expense", () => {
        expect(
            categorizeTransaction("Netflix Subscription", "personal", false),
        ).toBe("Entertainment")
    })

    it("falls back to Other for unmatched personal expense", () => {
        expect(categorizeTransaction("Mystery Vendor", "personal", false)).toBe(
            "Other",
        )
    })

    it("falls back to Other Revenue for unmatched personal income", () => {
        expect(categorizeTransaction("Mystery Source", "personal", true)).toBe(
            "Other",
        )
    })

    it("maps Stripe to Sales Revenue for business income", () => {
        expect(
            categorizeTransaction("Stripe Payout Invoice 123", "business", true),
        ).toBe("Sales Revenue")
    })

    it("maps AWS to Software for business expense", () => {
        expect(
            categorizeTransaction("AWS Web Services", "business", false),
        ).toBe("Software")
    })
})

describe("parseCsvRows", () => {
    it("parses Date/Description/Amount rows with positive=income, negative=expense", () => {
        const out = parseCsvRows(
            [
                { Date: "2024-03-01", Description: "Direct Deposit Payroll", Amount: "5000" },
                { Date: "2024-03-02", Description: "Whole Foods Market", Amount: "-128.43" },
            ],
            "personal",
        )
        expect(out).toHaveLength(2)
        expect(out[0].type).toBe("income")
        expect(out[0].amount).toBe(5000)
        expect(out[0].category).toBe("Salary")
        expect(out[1].type).toBe("expense")
        expect(out[1].amount).toBeCloseTo(128.43, 2)
        expect(out[1].category).toBe("Food")
    })

    it("falls back to Debit/Credit columns when Amount is absent", () => {
        const out = parseCsvRows(
            [
                { Date: "2024-03-01", Description: "Paycheck", Credit: "2000" },
                { Date: "2024-03-02", Description: "Rent", Debit: "1500" },
            ],
            "personal",
        )
        expect(out).toHaveLength(2)
        expect(out[0].type).toBe("income")
        expect(out[0].amount).toBe(2000)
        expect(out[1].type).toBe("expense")
        expect(out[1].amount).toBe(1500)
        expect(out[1].category).toBe("Housing")
    })

    it("skips rows missing required fields", () => {
        const out = parseCsvRows(
            [
                { Date: "2024-03-01", Description: "Has no amount" },
                { Date: "2024-03-01", Amount: "100" },
            ],
            "personal",
        )
        expect(out).toHaveLength(0)
    })

    it("handles accounting-style negatives in parentheses", () => {
        const out = parseCsvRows(
            [{ Date: "2024-03-01", Description: "Electric Bill", Amount: "(120.00)" }],
            "personal",
        )
        expect(out[0].type).toBe("expense")
        expect(out[0].amount).toBe(120)
    })
})

describe("parseTxtText", () => {
    it("parses dated single-line transactions", () => {
        const txt = [
            "03/14/2024  STARBUCKS COFFEE  -5.75",
            "03/15/2024  PAYROLL DIRECT DEPOSIT  2500.00",
        ].join("\n")
        const out = parseTxtText(txt, "personal")
        expect(out).toHaveLength(2)
        expect(out[0].type).toBe("expense")
        expect(out[1].type).toBe("income")
        expect(out[1].amount).toBe(2500)
    })

    it("ignores lines without a transaction shape", () => {
        const txt = "Statement header\nPage 1 of 4\n03/14/2024  COFFEE  -5.75"
        const out = parseTxtText(txt, "personal")
        expect(out).toHaveLength(1)
    })
})

describe("parsePdfText", () => {
    it("parses multiple transactions from one blob of extracted text", () => {
        const text =
            "Account Summary 03/01 STARBUCKS -7.50 03/02 PAYROLL 2500.00 03/03 RENT -1500.00"
        const out = parsePdfText(text, "personal")
        expect(out.length).toBeGreaterThanOrEqual(3)
        expect(out.find((t) => t.category === "Housing")).toBeTruthy()
    })
})

describe("detectFileKind", () => {
    it("recognises csv, txt, pdf", () => {
        expect(detectFileKind("statement.csv")).toBe("csv")
        expect(detectFileKind("statement.TXT")).toBe("txt")
        expect(detectFileKind("statement.Pdf")).toBe("pdf")
    })

    it("returns null for unsupported types", () => {
        expect(detectFileKind("statement.xlsx")).toBeNull()
    })
})
