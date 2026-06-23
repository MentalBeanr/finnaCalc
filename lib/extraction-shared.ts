/**
 * Client-safe extraction helpers: normalize raw AI output into typed income
 * suggestions. No Node/DB imports.
 *
 * Per the architecture (v2 §11.3), extraction is a SUGGESTION — the user confirms
 * every value, and the confirmed value (not the raw extraction) is what the engine
 * consumes. This module only shapes/validates suggestions; it never applies them.
 */
import { incomeTypeLabel, parseDollarsToCents, type InterviewIncomeType } from "./interview-shared"

export interface RawIncomeSuggestion {
    type?: string
    amount?: string | number
    withholding?: string | number
}

export interface IncomeSuggestion {
    type: InterviewIncomeType
    label: string
    amountCents: number
    withholdingCents: number
}

function normalizeType(raw?: string): InterviewIncomeType | null {
    if (!raw) return null
    const s = raw.toLowerCase()
    if (s.includes("w-2") || s.includes("w2") || s.includes("wage")) return "w2"
    if (s.includes("1099-int") || s.includes("interest")) return "1099_int"
    if (s.includes("social") || s === "ss" || s.includes("ssa")) return "ss"
    return null
}

function toCents(value?: string | number): number | null {
    if (value === undefined || value === null) return null
    return parseDollarsToCents(String(value))
}

/** Validate and type raw AI suggestions; drop anything unusable. */
export function normalizeSuggestions(raw: RawIncomeSuggestion[]): IncomeSuggestion[] {
    const out: IncomeSuggestion[] = []
    for (const item of raw) {
        const type = normalizeType(item.type)
        const amountCents = toCents(item.amount)
        if (!type || amountCents === null || amountCents <= 0) continue
        const withholdingCents = toCents(item.withholding) ?? 0
        out.push({
            type,
            label: incomeTypeLabel(type),
            amountCents,
            withholdingCents: Math.max(0, withholdingCents),
        })
    }
    return out
}
