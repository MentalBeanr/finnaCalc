/**
 * Payment service: the filing-fee rail (database-design.md §9.2).
 *
 * A payment-processor seam — like the auth IdP seam — so the charge path is real
 * and testable without any PSP keys. The default StubPaymentProcessor records a
 * captured charge; a StripePaymentProcessor implementing the same interface is
 * the production path. The IRS-rail (balance-due/refund) is a DIFFERENT processor
 * and belongs to the filing workflow, never mixed here.
 */
import { desc, eq } from "drizzle-orm"
import { getDb } from "@/db/client"
import { payments, type Payment } from "@/db/schema"
import { getReturn } from "./returns"

export interface ChargeInput {
    amountCents: number
    idempotencyKey: string
    description: string
}

export interface PaymentProcessor {
    readonly name: string
    charge(input: ChargeInput): Promise<{ ref: string; status: "captured" | "failed" }>
}

/** Build/CI/dev default: deterministically "captures" without a real PSP. */
export class StubPaymentProcessor implements PaymentProcessor {
    readonly name = "stub"
    async charge(input: ChargeInput): Promise<{ ref: string; status: "captured" }> {
        return { ref: `stub_${input.idempotencyKey}`, status: "captured" }
    }
}

let processor: PaymentProcessor = new StubPaymentProcessor()

/** Install the active payment processor (e.g. Stripe) at server startup. */
export function setPaymentProcessor(next: PaymentProcessor): void {
    processor = next
}

/**
 * Charge (or reuse) the filing fee for a return. Idempotent on the
 * per-return filing-fee key; a zero amount is a no-op (nothing to charge).
 */
export async function createFilingFeePayment(
    userId: string,
    returnId: string,
    amountCents: number,
): Promise<Payment | null> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return null
    if (amountCents <= 0) return null

    const idempotencyKey = `${returnId}:filing_fee`
    const db = getDb()

    const [existing] = await db
        .select()
        .from(payments)
        .where(eq(payments.idempotencyKey, idempotencyKey))
        .limit(1)
    if (existing && existing.status === "captured") return existing

    const res = await processor.charge({
        amountCents,
        idempotencyKey,
        description: `Filing fee for ${ret.taxYear} return`,
    })

    if (existing) {
        const [updated] = await db
            .update(payments)
            .set({ status: res.status, processorRef: res.ref, updatedAt: new Date() })
            .where(eq(payments.id, existing.id))
            .returning()
        return updated
    }

    const [row] = await db
        .insert(payments)
        .values({
            userId,
            returnId,
            kind: "filing_fee",
            amountCents,
            processor: processor.name,
            processorRef: res.ref,
            status: res.status,
            idempotencyKey,
        })
        .returning()
    return row
}

/** A return's payments, newest first (user-scoped). */
export async function listPayments(userId: string, returnId: string): Promise<Payment[]> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return []
    const db = getDb()
    return db
        .select()
        .from(payments)
        .where(eq(payments.returnId, returnId))
        .orderBy(desc(payments.createdAt))
}
