/**
 * Client-safe tax-return constants and pure helpers.
 *
 * No Node or database imports — safe for client components, server actions, and
 * the server returns service. I/O lives in lib/server/returns.ts.
 */

export const FILING_STATUS_OPTIONS = [
    { value: "single", label: "Single" },
    { value: "mfj", label: "Married filing jointly" },
    { value: "mfs", label: "Married filing separately" },
    { value: "hoh", label: "Head of household" },
    { value: "qss", label: "Qualifying surviving spouse" },
] as const

export type FilingStatusValue = (typeof FILING_STATUS_OPTIONS)[number]["value"]

export function isFilingStatus(value: string): value is FilingStatusValue {
    return FILING_STATUS_OPTIONS.some((o) => o.value === value)
}

/** Loosely-typed basics input as received from a form (validated server-side). */
export interface ReturnBasicsInput {
    filingStatus?: string
    stateOfResidence?: string
}

export function filingStatusLabel(value: string | null | undefined): string {
    if (!value) return "Not set"
    return FILING_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value
}

/** Human labels for the return lifecycle states (database-design.md §16.1). */
export const RETURN_STATE_LABELS: Record<string, string> = {
    draft: "Draft",
    ready_to_review: "Ready to review",
    ready_to_file: "Ready to file",
    signed: "Signed",
    submitted: "Submitted",
    accepted: "Accepted",
    rejected: "Rejected",
    amended: "Amended",
}

export function returnStateLabel(state: string): string {
    return RETURN_STATE_LABELS[state] ?? state
}

/**
 * Allowed return state transitions (database-design.md §16.1). Forward progress
 * plus the edit/remediation back-edges. Filing-side states (signed → submitted →
 * accepted/rejected) are driven by the filing workflow, not the model UI.
 */
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    draft: ["ready_to_review"],
    ready_to_review: ["draft", "ready_to_file"],
    ready_to_file: ["ready_to_review", "signed"],
    signed: ["submitted"],
    submitted: ["accepted", "rejected", "imperfect"],
    rejected: ["draft"],
    accepted: ["amended"],
    amended: [],
}

export function canTransition(from: string, to: string): boolean {
    return (ALLOWED_TRANSITIONS[from] ?? []).includes(to)
}

/** A draft (or rejected) return may be deleted by its owner. */
export function canDelete(state: string): boolean {
    return state === "draft" || state === "rejected"
}

/** The N most recent tax years available to start, newest first. */
export function availableTaxYears(latest: number, count = 3): number[] {
    return Array.from({ length: count }, (_, i) => latest - i)
}

/** Format integer cents as whole-dollar USD. */
export function formatCents(cents: number): string {
    return (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    })
}

export const US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
] as const
