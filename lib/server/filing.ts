/**
 * Filing workflow service (user-flows.md §11, database-design.md §8, §10).
 *
 * Consent → e-signature → pre-transmit reconciliation gate → transmit via a
 * partner transmitter → the per-jurisdiction submission state machine → ack /
 * reject. A Transmitter seam (like the auth/payment seams) keeps the flow real
 * and testable without a live IRS connection: the StubTransmitter accepts; a real
 * partner/MeF transmitter implementing the same interface is the production path.
 */
import { and, desc, eq, gt, sql } from "drizzle-orm"
import { getDb } from "@/db/client"
import {
    consentsSigned,
    eSignatures,
    filingEvents,
    filings,
    type ESignature,
    type Filing,
} from "@/db/schema"
import { CONSENT_ITEMS, CONSENT_VERSION } from "@/lib/filing-shared"
import { getReturn, transitionReturn } from "./returns"
import { computeForReturn, getLatestCalculation, runCalculation } from "./federal-support"
import { getUserById } from "./users"
import {
    sendReturnAcceptedEmail,
    sendReturnRejectedEmail,
    sendReturnSubmittedEmail,
} from "./email"

// ── Transmitter seam ─────────────────────────────────────────────────────────

export interface TransmitResult {
    submissionId: string
    status: "accepted" | "rejected" | "imperfect"
    ackCode?: string
    rejectCodes?: { code: string; desc: string }[]
}

export interface Transmitter {
    readonly name: string
    transmit(input: { returnId: string; payload: unknown }): Promise<TransmitResult>
}

/** Build/CI/dev default: accepts deterministically. */
export class StubTransmitter implements Transmitter {
    readonly name = "stub"
    async transmit(input: { returnId: string; payload: unknown }): Promise<TransmitResult> {
        return { submissionId: `stub_${input.returnId}`, status: "accepted", ackCode: "ACCEPTED" }
    }
}

let transmitter: Transmitter = new StubTransmitter()

export function setTransmitter(next: Transmitter): void {
    transmitter = next
}

// ── Consent & signature ──────────────────────────────────────────────────────

export async function getConsents(userId: string, returnId: string) {
    const ret = await getReturn(userId, returnId)
    if (!ret) return []
    const db = getDb()
    return db.select().from(consentsSigned).where(eq(consentsSigned.returnId, returnId))
}

/** Record all required consents (idempotent — existing ones are not duplicated). */
export async function recordConsents(userId: string, returnId: string): Promise<boolean> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return false
    const db = getDb()
    const existing = await db
        .select()
        .from(consentsSigned)
        .where(eq(consentsSigned.returnId, returnId))
    const have = new Set(existing.map((c) => c.consentType))
    const toInsert = CONSENT_ITEMS.filter((c) => !have.has(c.type)).map((c) => ({
        userId,
        returnId,
        consentType: c.type,
        version: CONSENT_VERSION,
        accepted: true,
    }))
    if (toInsert.length > 0) await db.insert(consentsSigned).values(toInsert)
    return true
}

export async function getESignature(userId: string, returnId: string): Promise<ESignature | null> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return null
    const db = getDb()
    const [row] = await db
        .select()
        .from(eSignatures)
        .where(eq(eSignatures.returnId, returnId))
        .limit(1)
    return row ?? null
}

/**
 * Record the Self-Select PIN signature and advance ready_to_file → signed. The
 * prior-year AGI / IP PIN values are verified, then discarded — only the result
 * is stored (the values belong in the vault and the MeF payload).
 */
export async function recordSignature(
    userId: string,
    returnId: string,
    input: { priorYearAgiMatch: boolean; ipPinPresent: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return { ok: false, error: "Return not found." }

    const consents = await getConsents(userId, returnId)
    if (consents.length < CONSENT_ITEMS.length) {
        return { ok: false, error: "Accept the required consents first." }
    }

    const db = getDb()
    const [existing] = await db
        .select()
        .from(eSignatures)
        .where(eq(eSignatures.returnId, returnId))
        .limit(1)
    if (!existing) {
        await db.insert(eSignatures).values({
            returnId,
            method: "self_select_pin",
            priorYearAgiMatch: input.priorYearAgiMatch,
            ipPinPresent: input.ipPinPresent,
        })
    }

    if (ret.state === "ready_to_file") {
        await transitionReturn(userId, returnId, "signed")
    }
    return { ok: true }
}

// ── Submission ───────────────────────────────────────────────────────────────

export async function getLatestFiling(userId: string, returnId: string): Promise<Filing | null> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return null
    const db = getDb()
    const [row] = await db
        .select()
        .from(filings)
        .where(and(eq(filings.returnId, returnId), eq(filings.jurisdiction, "federal")))
        .orderBy(desc(filings.builtAt))
        .limit(1)
    return row ?? null
}

async function recordFilingEvent(
    filingId: string,
    fromState: string | null,
    toState: string,
    eventKind: string,
    actor: string,
    payload?: Record<string, unknown>,
) {
    await getDb()
        .insert(filingEvents)
        .values({ filingId, fromState, toState, eventKind, actor, payload: payload ?? null })
}

// ── Fraud controls ────────────────────────────────────────────────────────────

/** $15,000 — refunds above this are flagged for anomaly review. */
const REFUND_ANOMALY_THRESHOLD_CENTS = 1_500_000

/**
 * Anti-fraud checks run at the start of submitFederalReturn.
 * Returns an error string to surface to the user, or null if everything is OK.
 */
async function checkFraudGates(
    returnId: string,
): Promise<string | null> {
    const db = getDb()

    // Gate 1: block re-submission if an accepted federal filing already exists.
    const [alreadyAccepted] = await db
        .select({ id: filings.id })
        .from(filings)
        .where(
            and(
                eq(filings.returnId, returnId),
                eq(filings.jurisdiction, "federal"),
                eq(filings.state, "accepted"),
            ),
        )
        .limit(1)
    if (alreadyAccepted) {
        return "This return has already been accepted by the IRS and cannot be resubmitted."
    }

    // Gate 2: velocity cap — at most 3 federal submission attempts per return in 24 hours.
    const window24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [{ attempts }] = await db
        .select({ attempts: sql<number>`count(*)::int` })
        .from(filings)
        .where(
            and(
                eq(filings.returnId, returnId),
                eq(filings.jurisdiction, "federal"),
                gt(filings.builtAt, window24h),
            ),
        )
    if (attempts >= 3) {
        return "Too many submission attempts in 24 hours. Please wait before trying again."
    }

    return null
}

/**
 * Submit the federal return: reconciliation gate → build → transmit → ack. A
 * mismatch between the freshly recomputed result and the persisted snapshot
 * blocks transmission (v2 §7.3).
 */
export async function submitFederalReturn(
    userId: string,
    returnId: string,
): Promise<{ ok: true; state: string } | { ok: false; error: string }> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return { ok: false, error: "Return not found." }
    if (ret.state !== "signed") {
        return { ok: false, error: "Sign your return before filing." }
    }

    const fraudError = await checkFraudGates(returnId)
    if (fraudError) return { ok: false, error: fraudError }

    const user = await getUserById(userId)
    const userEmail = user?.email

    // Persist the reviewed snapshot and run the reconciliation gate.
    const calc = await runCalculation(userId, returnId)
    if (!calc) return { ok: false, error: "The return could not be computed." }
    const snapshot = await getLatestCalculation(userId, returnId)
    const fresh = await computeForReturn(userId, returnId)
    if (!snapshot || !fresh || !fresh.converged) {
        return { ok: false, error: "The return did not compute cleanly. Filing is blocked." }
    }
    if (
        snapshot.refundOrDueCents !== fresh.refundOrDueCents ||
        snapshot.taxAfterCreditsCents !== fresh.taxAfterCreditsCents
    ) {
        return { ok: false, error: "Reconciliation failed — the return was not transmitted." }
    }

    const db = getDb()
    const [filing] = await db
        .insert(filings)
        .values({
            returnId,
            jurisdiction: "federal",
            channel: "partner",
            linkage: "unlinked",
            state: "built",
            calculationId: calc.calculationId,
        })
        .returning()
    await recordFilingEvent(filing.id, null, "built", "build", "system")

    // Gate 3: log an anomaly event for unusually large refunds (non-blocking).
    if (fresh.refundOrDueCents > REFUND_ANOMALY_THRESHOLD_CENTS) {
        await recordFilingEvent(filing.id, null, "built", "fraud_flag", "system", {
            reason: "large_refund",
            refundCents: fresh.refundOrDueCents,
        })
    }

    await transitionReturn(userId, returnId, "submitted")
    if (userEmail) {
        sendReturnSubmittedEmail(userEmail, ret.taxYear, returnId).catch(console.error)
    }

    const now = new Date()
    await db
        .update(filings)
        .set({ state: "transmitted", transmittedAt: now })
        .where(eq(filings.id, filing.id))
    await recordFilingEvent(filing.id, "built", "transmitted", "transmit", "system")

    const result = await transmitter.transmit({ returnId, payload: { calculationId: calc.calculationId } })

    await db
        .update(filings)
        .set({
            state: result.status,
            submissionId: result.submissionId,
            ackCode: result.ackCode ?? null,
            rejectCodes: result.rejectCodes ?? null,
            receivedAt: now,
            validatedAt: now,
            acknowledgedAt: now,
        })
        .where(eq(filings.id, filing.id))
    await recordFilingEvent(
        filing.id,
        "transmitted",
        result.status,
        result.status === "rejected" ? "reject" : "ack",
        "irs",
    )

    // Advance the return to its terminal state.
    if (result.status === "accepted" || result.status === "imperfect") {
        await transitionReturn(userId, returnId, "accepted")
        if (userEmail) {
            sendReturnAcceptedEmail(userEmail, ret.taxYear, returnId, result.ackCode).catch(
                console.error,
            )
        }
    } else {
        await transitionReturn(userId, returnId, "rejected")
        if (userEmail) {
            sendReturnRejectedEmail(
                userEmail,
                ret.taxYear,
                returnId,
                result.rejectCodes ?? [],
            ).catch(console.error)
        }
    }

    return { ok: true, state: result.status }
}
