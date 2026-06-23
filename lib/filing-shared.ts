/**
 * Client-safe filing constants and pure helpers. No Node/DB imports.
 */

/** §7216 + e-sign consents the taxpayer must accept before filing. */
export const CONSENT_ITEMS = [
    {
        type: "7216_use",
        label: "Use of tax information",
        body: "I consent to FinnaCalc using my tax return information to prepare my return.",
    },
    {
        type: "7216_disclosure",
        label: "Disclosure for e-file",
        body: "I consent to FinnaCalc disclosing my return to the IRS (via its authorized transmitter) to electronically file it.",
    },
    {
        type: "esign_disclosure",
        label: "Electronic signature",
        body: "I agree to sign my return electronically using a Self-Select PIN.",
    },
] as const

export const CONSENT_VERSION = "v1-2026"

export const FILING_STATE_LABELS: Record<string, string> = {
    built: "Built",
    transmitted: "Transmitted",
    received: "Received",
    validated: "Validated",
    accepted: "Accepted",
    rejected: "Rejected",
    imperfect: "Accepted (imperfect)",
}

export function filingStateLabel(state: string): string {
    return FILING_STATE_LABELS[state] ?? state
}

const REJECT_MESSAGES: Record<string, string> = {
    "IND-031-04": "The prior-year AGI you entered doesn't match IRS records. Re-enter it and resubmit.",
    "IND-032-04": "Your spouse's prior-year AGI doesn't match IRS records.",
    "IND-181-01": "The IP PIN is missing or incorrect. Check your IRS notice and re-enter it.",
}

/** Plain-language remediation text for an IRS reject code. */
export function rejectMessage(code: string): string {
    return REJECT_MESSAGES[code] ?? `The IRS rejected the return with code ${code}. Review your entries and resubmit.`
}

/** Validate the Self-Select PIN signature inputs. */
export function validateSignatureInput(input: { priorYearAgi: string; ipPin?: string }):
    | { ok: true }
    | { ok: false; error: string } {
    const agi = input.priorYearAgi.trim().replace(/[$,\s]/g, "")
    if (agi === "" || !/^\d+$/.test(agi)) {
        return { ok: false, error: "Enter last year's adjusted gross income (whole dollars)." }
    }
    if (input.ipPin && input.ipPin.trim() !== "" && !/^\d{6}$/.test(input.ipPin.trim())) {
        return { ok: false, error: "An IP PIN is exactly 6 digits." }
    }
    return { ok: true }
}
